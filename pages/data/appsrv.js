const appSrvDomain = 'https://hzjsdz.cn';

/**
 * 用户账号密码登陆
 */
function userLogin(name, password, successCb, failCb) {
  console.log('adminLogin', name, password);
  wx.request({
    url: `${appSrvDomain}/appsrv/api/login`,
    method: "POST",
    header: {
      'accept': 'application/json',
      'content-type': 'application/json'
    },
    data: {
      username: name,
      // start: '2019-01-10T09:00:00',
      // end: '2019-01-11T12:00:00'
      password: password,
    },
    success: function (result) {
      successCb(result);
    },
    fail: function () {
      failCb();
    },
  });
}
/**判断管理者权限是否过期，每7天需要重新登陆一次
 * 如果管理者权限依然有效，返回true，否则返回false
 */
function isAdminLogin(successCB) {
  wx.getStorage({
    key: 'isAdmin',
    success(res) {
      let loginTime = res.data;
      let currentTime = new Date().getTime();
      let _isAdmin = currentTime - loginTime < 7 * 24 * 3600 * 1000;
      //console.log('isAdmin:', currentTime, loginTime, currentTime - loginTime, _isAdmin);
      successCB( _isAdmin);
    }
  });  
}

/**
 * name : 服务器用于提取文件的key
 * filePath: 小程序内部文件路径
 */
function fileUpload(name, filePath, successCb, failCb, progressCb) {
  //console.log('bleLogUpload:', name, filePath);
  let uploadTask = wx.uploadFile({
    url: `${appSrvDomain}/appsrv/analysis/upload`,
    method: "POST",
    header: {
      'accept': 'application/json'
    },
    name: name,
    filePath: filePath,
    success: function (result) {
      uploadTask.offProgressUpdate(progressCb);
      successCb(result);
    },
    fail: function () {
      uploadTask.offProgressUpdate(progressCb);
      failCb();
    },
  });
  uploadTask.onProgressUpdate(progressCb);
}

/**
 * 检测bms所有可用版本
 */
function bmsGetVersions(successCb, failCb) {
  wx.request({
    url: `${appSrvDomain}/appsrv/api/update/get_versions?target=bms_app`,
    method: "GET",
    header: {
      'accept': 'application/json',
      'content-type': 'application/json'
    },
    data: {
    },
    success: function (result) {
      successCb(result);
    },
    fail: function () {
      failCb();
    },
  });
}
/**
 * 检测bms更新
 */
function bmsCheckUpdate(bms_hw, successCb, failCb) {
  console.log('bmsCheckUpdate:', bms_hw);
  wx.request({
    url: `${appSrvDomain}/appsrv/api/update/check?target=bms_app&hw=${bms_hw}`,
    method: "GET",
    header: {
      'accept': 'application/json',
      'content-type': 'application/json'
    },
    data: {
    },
    success: function (result) {
      successCb(result);
    },
    fail: function () {
      failCb();
    },
  });
}

function downloadFile(url, successCb, failCb, progressCb) {
  let downloadTask = wx.downloadFile({url: url,
    success: function(res) {
      successCb(res);
      downloadTask.offProgressUpdate(progressCb);
    },
    fail: function(res) {
      downloadTask.offProgressUpdate(progressCb);
      failCb(res);
    }
  });
  downloadTask.onProgressUpdate(progressCb);
}

/**
 * 设备注册，获取唯一ID号
 */
function deviceRegister(mac, successCb, failCb) {
  console.log('deviceRegister,mac=', mac);
  wx.request({
    url: `${appSrvDomain}/appsrv/bms/device_id`,
    method: "POST",
    header: {
      'accept': 'application/json',
      'content-type': 'application/json'
    },
    data: {
      mac: mac,
      // start: '2019-01-10T09:00:00',
      // end: '2019-01-11T12:00:00'
    },
    success: function (result) {
      successCb(result);
    },
    fail: function () {
      failCb();
    },
  });
}
export { userLogin, isAdminLogin, fileUpload, 
bmsCheckUpdate, downloadFile, deviceRegister, bmsGetVersions}