const EAZY_EMAIL='info@eazymedicaltransportation.com';
const FORMSUBMIT=`https://formsubmit.co/ajax/${EAZY_EMAIL}`;
const SITE_ORIGIN='https://www.eazymedicaltransportation.com';

const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
const clean=(v,max=500)=>String(v??'').trim().slice(0,max);
const email=v=>{const s=clean(v,254);return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)?s:''};
const phone=v=>clean(v,40);
const boolAccept=v=>v===true||/^yes\b/i.test(String(v??''))||String(v)==='1';

function makeId(){
  const d=new Date();
  const y=String(d.getUTCFullYear()).slice(-2),m=String(d.getUTCMonth()+1).padStart(2,'0'),day=String(d.getUTCDate()).padStart(2,'0');
  const rand=crypto.randomUUID().replace(/-/g,'').slice(0,6).toUpperCase();
  return `EAZY-${y}${m}${day}-${rand}`;
}

async function claimsFor(origin){
  try{
    const r=await fetch(new URL('/providers-claimed.json?v=ride-api-1',origin),{cache:'no-store'});
    if(!r.ok)return {};
    const d=await r.json();
    return d?.claims||{};
  }catch{return {}}
}

async function sendFormSubmit(fields){
  const r=await fetch(FORMSUBMIT,{
    method:'POST',
    headers:{
      'content-type':'application/json',
      'accept':'application/json',
      'origin':SITE_ORIGIN,
      'referer':`${SITE_ORIGIN}/`,
      'user-agent':'Mozilla/5.0 (compatible; EAZY-Ride-Relay/1.0)'
    },
    body:JSON.stringify(fields)
  });
  const text=await r.text();
  let data={};
  try{data=JSON.parse(text)}catch{throw new Error(`Email relay returned ${r.status} ${r.headers.get('content-type')||'response'} instead of JSON.`)}
  if(!r.ok||data?.success===false)throw new Error(clean(data?.message||`Email relay failed (${r.status})`,300));
  return data;
}

function baseFields(subject){
  return {_subject:subject,_template:'table',_captcha:'false',_url:`${SITE_ORIGIN}/`};
}

async function rideRequest(request,body){
  const provider=body?.provider||{},passenger=body?.passenger||{},trip=body?.trip||{};
  const providerName=clean(provider.name,160),npi=clean(provider.npi,20),passengerName=clean(passenger.name,120),passengerEmail=email(passenger.email),passengerPhone=phone(passenger.phone);
  const pickup=clean(trip.pickup,300),destination=clean(trip.destination,300),date=clean(trip.date,30),time=clean(trip.time,30);
  if(!providerName||!passengerName||!passengerEmail||!passengerPhone||!pickup||!destination||!date||!time)return json({ok:false,error:'Please complete all required ride-request fields, including passenger email.'},400);

  const origin=new URL(request.url).origin;
  const claims=await claimsFor(origin);
  const claim=npi?claims[String(npi)]||{}:{};
  const dispatchEmail=email(claim.dispatchEmail||provider.dispatchEmail);
  const accepts=boolAccept(claim.acceptsOnlineRequests??claim.accepts);
  const direct=!!(dispatchEmail&&accepts);
  const id=makeId();
  const responseUrl=new URL('/ride-response-v2.html',origin);
  responseUrl.searchParams.set('id',id);
  responseUrl.searchParams.set('provider',providerName);
  responseUrl.searchParams.set('passengerEmail',passengerEmail);
  responseUrl.searchParams.set('passengerName',passengerName);

  const fields={
    ...baseFields(`EAZY Ride Request ${id} — ${providerName}`),
    request_id:id,
    status:'PENDING PROVIDER CONFIRMATION',
    provider:providerName,
    provider_npi:npi||'Not available',
    provider_phone:clean(provider.phone,60)||'Not available',
    provider_location:[clean(provider.city,100),clean(provider.state,20)].filter(Boolean).join(', '),
    passenger:passengerName,
    email:passengerEmail,
    passenger_phone:passengerPhone,
    pickup,
    destination,
    ride_date:date,
    pickup_time:time,
    trip_type:clean(trip.tripType||trip.trip,60),
    service_needed:clean(trip.service||trip.mobility,100),
    special_instructions:clean(trip.notes,1000)||'None provided',
    routing:direct?'Sent to connected provider dispatch and EAZY':'Sent to EAZY for provider relay/follow-up',
    provider_response_link:direct?responseUrl.toString():'Provider is not yet connected to direct EAZY dispatch.'
  };
  if(direct)fields._cc=dispatchEmail;
  await sendFormSubmit(fields);
  return json({ok:true,id,status:'pending_provider_confirmation',routedDirectly:direct,provider:providerName});
}

async function providerResponse(body){
  const id=clean(body?.id,80),provider=clean(body?.provider,160),decision=clean(body?.decision,20).toLowerCase(),passengerEmail=email(body?.passengerEmail),passengerName=clean(body?.passengerName,120);
  if(!id||!provider||!['accept','decline'].includes(decision))return json({ok:false,error:'Invalid provider response.'},400);
  const accepted=decision==='accept';
  const fields={
    ...baseFields(`EAZY Ride ${accepted?'ACCEPTED':'DECLINED'} — ${id}`),
    request_id:id,
    provider,
    provider_response:accepted?'ACCEPTED':'DECLINED',
    rider:passengerName||'Passenger',
    message:accepted
      ?`${provider} accepted EAZY ride request ${id}. The rider should coordinate any final pickup details directly with the provider.`
      :`${provider} declined EAZY ride request ${id}. The rider should return to EAZY to select another provider.`
  };
  if(passengerEmail)fields._cc=passengerEmail;
  await sendFormSubmit(fields);
  return json({ok:true,id,decision:accepted?'accepted':'declined'});
}

export async function POST(request){
  try{
    const type=request.headers.get('content-type')||'';
    if(!type.includes('application/json'))return json({ok:false,error:'JSON required.'},415);
    const origin=request.headers.get('origin');
    if(origin&&!/^https:\/\/(www\.)?eazymedicaltransportation\.com$/i.test(origin)&&!origin.includes('localhost'))return json({ok:false,error:'Origin not allowed.'},403);
    const body=await request.json();
    if(body?.kind==='provider_response')return await providerResponse(body);
    return await rideRequest(request,body);
  }catch(err){
    console.error('EAZY ride API error',err);
    return json({ok:false,error:clean(err?.message||'Ride request could not be submitted.',300)},502);
  }
}

export async function GET(request){
  const url=new URL(request.url);
  if(url.searchParams.get('activate')==='1'){
    try{
      const result=await sendFormSubmit({...baseFields('EAZY Ride Relay Activation'),setup:'EAZY ride-request background relay activation test',timestamp:new Date().toISOString()});
      return json({ok:true,activationRequestSent:true,relay:result?.message||'submitted'});
    }catch(err){return json({ok:false,error:clean(err?.message||'Activation request failed.',300)},502)}
  }
  return json({ok:true,service:'EAZY ride request API',status:'ready'});
}
