
const maxApiCallsRunning = 1; // max concurrent api calls

let callsRunning = 0;
let callTimings = [];
let currentCall = [];
let integrationQueue = [];
let integrationAttempts = [];
let completedCalls = [];
let sessionCallsPerLead = [];

let sendButtons = '';
let callsRunningInterval = [];

let createAllButtonsList = [];




/** function createSageQuote()
 * * prepare specific lead for integration
 */
function runTask(el_id){

  const el = document.getElementById(el_id);

  let xdata_index = el.getAttribute('xdata-index');
  let xdata_id = el.getAttribute('xdata-id');
  let btn_active = el.getAttribute('ui-active');

  if(btn_active !== "true"){
    return;
  }

  el.setAttribute('ui-active', "false");
  el.classList.add("btn-disabled");

  integrationQueue.push({
    "el_id": el_id,
    "xdata_index": xdata_index,
    "xdata_id": xdata_id,
    "start_time": '',
    "end_time": ''
  });

  updatecallTimings();

  if (currentCall.length == 0) {
    ApiCallInit();
  }

}








/** function useAxios()
 * * send lead record to integration server
 */
function useAxios(callPassed){
  
  if (callPassed[0] == currentCall[0]) {
    //console.log(` ..... they are equal !!`);
  } else {
    ApiCallEnd({'error':'Interface Error: call mixup - Request aborted'}, currentCall['xdata_index']);
    return;
  }

  updatecallTimings();

  const thisCall = currentCall[0];
  const el_id = thisCall.el_id;

  let el = document.getElementById(el_id);
  let xdata_route = el.getAttribute('xdata-route');
  let xdata_id = el.getAttribute('xdata-id');

  if(xdata_route == "urlParams"){
    requestUrl = `${endPoint}/${xdata_id}`;
  } else {
    requestUrl = `${endPoint}`;
  }

  let axiosConfig = {
    method: 'POST',
    url: requestUrl,
    headers: {
      'Content-Type': 'application/json'
    },
    data: JSON.stringify(data_final[thisCall['xdata_index']])
  };

  axios(axiosConfig)
    .then(result => {
        callsRunning--;
        let res = result.data;
        ApiCallEnd(res, thisCall['xdata_index']);
    })
    .catch(err => {
        callsRunning--;
        console.log(`Axios ERROR:> ${err}`);
        console.log(JSON.stringify(err));
        console.log(`thisCall['xdata_index']:`);
        console.log(thisCall['xdata_index']);
        console.log(`thisCall['xdata_id']:`);
        console.log(thisCall['xdata_id']);
        console.log(`thisCall:`);
        console.log(JSON.stringify(thisCall));
        ApiCallEnd({"error": err}, thisCall['xdata_index']);
        return;
    });
}










function watchInterval(intervalName, i, max){
  if(i >= max){
    clearInterval(intervalName);
    if (intervalName == 'callTimingsWatcher') {
      callTimingsWatcher = null;
      console.log(`  ~ * ~ ! ~ Clearing Interval: callTimingsWatcher`);
    }
  } 
}



function increaseCallsRunning(){
    callsRunning++;
}


/** function ApiCallInit ()
 * * manage the integationQueue
 * * init the main Request function if the Queue is in order
 */
function ApiCallInit () {
  
    if (currentCall.length == 1) {
      // console.log(` ! currentCall has 1 and is still waiting for a response: ${JSON.stringify(currentCall)}`);
    }
    if (currentCall.length > 1) {
      console.log(` ! ! * ! ! * CURRENT CALL length VIOLATION ! * ! : ${JSON.stringify(currentCall)}`);
      console.log(` - currentCall: `);
      console.log(JSON.stringify(currentCall));
      console.log(` - integrationQueue: `);
      console.log(JSON.stringify(integrationQueue));
      console.log(` ... emptying both arrays`);
      integrationQueue = [];
      currentCall = [];
      ApiCallInit();
    }

    if (currentCall.length == 0 && integrationQueue.length > 0) {
    

      let newCall = integrationQueue.shift();
      currentCall.push(newCall);
      if (currentCall.length == 1) {
        /**
         * * send for integration
         *  * first, populate seesionCalls
         */
        currentCall[0]['start_time'] = Date.now();
        cc_xdata_id = currentCall[0]['xdata_id'];
        if(sessionCallsPerLead[cc_xdata_id] && sessionCallsPerLead[cc_xdata_id].constructor.name == "Array"){
          sessionCallsPerLead[cc_xdata_id].push(currentCall[0]);
        } else {
          sessionCallsPerLead[cc_xdata_id] = [];
          sessionCallsPerLead[cc_xdata_id].push(currentCall[0]);
        }
        setTimeout(useAxios, 2000, currentCall); // delay before api call
      } else {
        ApiCallInit();
      }
  }

  if (currentCall.length == 0 && integrationQueue.length == 0) {
    completedCalls = [];
  }

  
  if (integrationQueue.length == 0) {
    updatecallTimings();
  }
  
} // function ApiCallInit ()




function ApiCallEnd (callRes, xdata_index) {

  /**
   * todo: must handle Queue conflicts, mismatches, violations etc better
    */
  if (xdata_index !== currentCall[0]['xdata_index']) {
    console.log(` * * !!  PROBLEM - Call Mismatch: `);
    console.log(` *! -- xdata_index: ${xdata_index}`);
    console.log(` - currentCall['xdata_index']: ${currentCall[0]['xdata_index']}`);
    console.log(currentCall[0]);
  }

  let oldCall = currentCall.shift();
  completedCalls.push(oldCall);
  integrationAttempts.push(oldCall);

  let el = document.getElementById(oldCall['el_id']);
  let result_el = document.getElementById('sageResult_'+oldCall['xdata_index']);

      //update the buttons and info blocks
      if (callRes) {
          // if(callRes.DocumentNumber){
          //     let pd = document.createElement("P");
          //     let td = document.createTextNode(`${callRes.DocumentNumber}`);
          //     pd.appendChild(td);
          //     result_el.appendChild(pd);
          //     pd.classList.add('data-created', 'data-feedback');
          // }
          // if(callRes.NewCustomer.ID){
          //     let pd = document.createElement("P");
          //     let td = document.createTextNode(`${callRes.NewCustomer.ID} : ${callRes.NewCustomer.Name}`);
          //     pd.appendChild(td);
          //     result_el.appendChild(pd);
          //     pd.classList.add('data-created', 'data-feedback');
          // }
          if(callRes.message){
              let pd = document.createElement("P");
              let td = document.createTextNode(`${callRes.message}`);
              pd.appendChild(td);
              result_el.appendChild(pd);
              pd.classList.add('data-message', 'data-feedback');
          }
          if(callRes.info && callRes.info.length > 0){
              for (let i=0; i < callRes.info.length; i++) {
                  let pd = document.createElement("P");
                  let td = document.createTextNode(`${callRes.info[i]}`);
                  pd.appendChild(td);
                  result_el.appendChild(pd);
                  pd.classList.add('data-info', 'data-feedback');
              }
          }
          if(callRes.error){
              let pd = document.createElement("P");
              let td = document.createTextNode(`${callRes.error}`);
              pd.appendChild(td);
              result_el.appendChild(pd);
              pd.classList.add('data-error', 'data-feedback');
          }
          if(callRes.errors && callRes.errors.length > 0){
              for (let i=0; i < callRes.errors.length; i++) {
                  let pd = document.createElement("P");
                  let td = document.createTextNode(`${callRes.errors[i]}`);
                  pd.appendChild(td);
                  result_el.appendChild(pd);
                  pd.classList.add('data-error', 'data-feedback');
              }
          }
          el.classList.remove("btn-disabled");
          el.setAttribute('ui-active', "true");
      } else {
      }

  //watchInterval(callTimingsWatcher, 1, 1);
  updatecallTimings()
  // console.log(` . :-) . :-) .  ... ... ... Done with Api Call End ... ... ... bye bye . :-) . :-) . `);
  ApiCallInit();

}





function updatecallTimings(){

    if (integrationQueue.length < 1 && currentCall.length < 1) {
      callTimings = [];
      return;
    }

    callTimings.push(Date.now());

    if (callTimings.length > 1) {
      let min_time = Math.min(...callTimings);
      let max_time = Math.max(...callTimings);
      let operation_time = max_time - min_time;
      let operation_time_display = `${(operation_time/1000).toFixed(2)} secs`;
      document.querySelector('.ops-time-total').innerHTML = operation_time_display;
    } 
    
}







/**
 * * function tickProgressBars()
 * *  update the progress of the request operations 
 */
function tickProgressBars(){

    const progMainEl = document.querySelector('.progress-mask-main');
    const progItemEl = document.querySelector('.progress-mask-item');
    const progMainElBG = document.querySelector('.ops-progress-bar-main');
    const progItemElBG = document.querySelector('.ops-progress-bar-item');
    const progOpsEl = document.querySelector('.wrapper-ops-progress');

    const itemGoodTime = 5;

    let cur_start = 0;
    let time_now = Date.now();
    let item_time_diff = 0;

    
    let iQL = integrationQueue.length - 0;
    let cUL = currentCall.length - 0;
    let cOL = completedCalls.length - 0;

    let totL = iQL + cUL + cOL;
    let mainCompletePerc = 0;
    let itemCompletePerc = 0;

    if (totL > 0 && cUL == 1) {

        progOpsEl.style.display = 'block';
        mainCompletePerc = ((cOL+1) / (totL+0.5)) * 100;

        cur_start = currentCall[0]['start_time'];
        item_time_diff = time_now - cur_start;
        itemCompletePerc = Math.min( ( (item_time_diff/1000) / itemGoodTime ) * 100, Math.floor(Math.random() * Math.floor(500)) );

        /**
         * * set BG color ofr the Main bar
         */
        let min_time = Math.min(...callTimings);
        let max_time = Math.max(...callTimings);
        let operation_time = (max_time - min_time)/1000;
        let mainGoodTime = itemGoodTime * totL;
        let operation_overdue = (operation_time / mainGoodTime) * 100;
        if (operation_overdue <= 100) {
          progMainElBG.classList.remove('progress-good', 'progress-bad', 'progress-vbad', 'progress-shocking');
          progMainElBG.classList.add('progress-vgood');
        }
        if (operation_overdue > 110) {
          progMainElBG.classList.remove('progress-vgood', 'progress-bad', 'progress-vbad', 'progress-shocking');
          progMainElBG.classList.add('progress-good');
        }
        if (operation_overdue > 250) {
          progMainElBG.classList.remove('progress-vgood', 'progress-good', 'progress-vbad', 'progress-shocking');
          progMainElBG.classList.add('progress-bad');
        }
        if (operation_overdue > 350) {
          progMainElBG.classList.remove('progress-vgood', 'progress-bad', 'progress-bad', 'progress-shocking');
          progMainElBG.classList.add('progress-vbad');
        }
        if (operation_overdue > 490) {
          progMainElBG.classList.remove('progress-vgood', 'progress-bad', 'progress-bad', 'progress-vbad');
          progMainElBG.classList.add('progress-shocking');
        }

        
        /**
         * * set BG color ofor the items bar
         */
        if (itemCompletePerc <= 100) {
          progItemElBG.classList.remove('progress-good', 'progress-bad', 'progress-vbad', 'progress-shocking');
          progItemElBG.classList.add('progress-vgood');
        }
        if (itemCompletePerc > 110) {
          progItemElBG.classList.remove('progress-vgood', 'progress-bad', 'progress-vbad', 'progress-shocking');
          progItemElBG.classList.add('progress-good');
        }
        if (itemCompletePerc > 250) {
          progItemElBG.classList.remove('progress-vgood', 'progress-good', 'progress-vbad', 'progress-shocking');
          progItemElBG.classList.add('progress-bad');
        }
        if (itemCompletePerc > 350) {
          progItemElBG.classList.remove('progress-vgood', 'progress-bad', 'progress-bad', 'progress-shocking');
          progItemElBG.classList.add('progress-vbad');
        }
        if (itemCompletePerc > 490) {
          progItemElBG.classList.remove('progress-vgood', 'progress-bad', 'progress-bad', 'progress-vbad');
          progItemElBG.classList.add('progress-shocking');
        }
    } else {
        progOpsEl.style.display = 'none';
    }
    
    progMainEl.style.left = mainCompletePerc+'%';


    progItemEl.style.left = itemCompletePerc/1.2+'%';
    
}





  
callTimingsWatcher = setInterval(function(){
    tickProgressBars();
},800);
callTimingsWatcher2 = setInterval(function(){
    updatecallTimings();
},1500);
callTimingsWatcher3 = setInterval(function(){
    updatecallTimings();
},5500);

