const pi = 3.1415926535897932384626;  
const x_pi = 3.14159265358979324 * 3000.0 / 180.0;  
const a = 6378245.0;  
const ee = 0.00669342162296594323;  

function transformLat(x, y) {  
    let ret = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y  
            + 0.2 * Math.sqrt(Math.abs(x));  
    ret += (20.0 * Math.sin(6.0 * x * pi) + 20.0 * Math.sin(2.0 * x * pi)) * 2.0 / 3.0;  
    ret += (20.0 * Math.sin(y * pi) + 40.0 * Math.sin(y / 3.0 * pi)) * 2.0 / 3.0;  
    ret += (160.0 * Math.sin(y / 12.0 * pi) + 320 * Math.sin(y * pi / 30.0)) * 2.0 / 3.0;  
    return ret;  
}  

function transformLon(x, y) {  
    let ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1  
            * Math.sqrt(Math.abs(x));  
    ret += (20.0 * Math.sin(6.0 * x * pi) + 20.0 * Math.sin(2.0 * x * pi)) * 2.0 / 3.0;  
    ret += (20.0 * Math.sin(x * pi) + 40.0 * Math.sin(x / 3.0 * pi)) * 2.0 / 3.0;  
    ret += (150.0 * Math.sin(x / 12.0 * pi) + 300.0 * Math.sin(x / 30.0  
            * pi)) * 2.0 / 3.0;  
    return ret;  
}  

function transform(lat, lon) {  
    if (outOfChina(lat, lon)) {  
        return [lat,lon];  
    }  
    let dLat = transformLat(lon - 105.0, lat - 35.0);  
    let dLon = transformLon(lon - 105.0, lat - 35.0);  
    let radLat = lat / 180.0 * pi;  
    let magic = Math.sin(radLat);  
    magic = 1 - ee * magic * magic;  
    let sqrtMagic = Math.sqrt(magic);  
    dLat = (dLat * 180.0) / ((a * (1 - ee)) / (magic * sqrtMagic) * pi);  
    dLon = (dLon * 180.0) / (a / sqrtMagic * Math.cos(radLat) * pi);  
    let mgLat = lat + dLat;  
    let mgLon = lon + dLon;  
    return [mgLat,mgLon];  
}  

function outOfChina(lat, lon) {  
    if (lon < 72.004 || lon > 137.8347)  
        return true;  
    if (lat < 0.8293 || lat > 55.8271)  
        return true;  
    return false;  
}  
/** 
 * 84 to 火星坐标系 (GCJ-02) World Geodetic System ==> Mars Geodetic System 
 * 
 * @param lat 
 * @param lon 
 * @return 
 */  
function gps84_To_Gcj02(lat, lon) {  
    if (outOfChina(lat, lon)) {  
        return [lat,lon];  
    }  
    let dLat = transformLat(lon - 105.0, lat - 35.0);  
    let dLon = transformLon(lon - 105.0, lat - 35.0);  
    let radLat = lat / 180.0 * pi;  
    let magic = Math.sin(radLat);  
    magic = 1 - ee * magic * magic;  
    let sqrtMagic = Math.sqrt(magic);  
    dLat = (dLat * 180.0) / ((a * (1 - ee)) / (magic * sqrtMagic) * pi);  
    dLon = (dLon * 180.0) / (a / sqrtMagic * Math.cos(radLat) * pi);  
    let mgLat = lat + dLat;  
    let mgLon = lon + dLon;  
    return [mgLat.toFixed(6), mgLon.toFixed(6)];  
}  

/* 
 *  火星坐标系 (GCJ-02) to 84 * * @param lon * @param lat * @return 
 */  
function gcj02_To_Gps84(lat, lon) {  
    let gps = transform(lat, lon);  
    let lontitude = lon * 2 - gps[1];  
    let latitude = lat * 2 - gps[0];  
    return [latitude.toFixed(6), lontitude.toFixed(6)];  
}  
/** 
 * 火星坐标系 (GCJ-02) 与百度坐标系 (BD-09) 的转换算法 将 GCJ-02 坐标转换成 BD-09 坐标 
 * 
 * @param lat 
 * @param lon 
 */  
function gcj02_To_Bd09(lat, lon) {  
    let x = lon, y = lat;  
    let z = Math.sqrt(x * x + y * y) + 0.00002 * Math.sin(y * x_pi);  
    let theta = Math.atan2(y, x) + 0.000003 * Math.cos(x * x_pi);  
    let tempLon = z * Math.cos(theta) + 0.0065;  
    let tempLat = z * Math.sin(theta) + 0.006;  
    let gps = [tempLat,tempLon];  
    return gps;  
}  

/** 
 * * 火星坐标系 (GCJ-02) 与百度坐标系 (BD-09) 的转换算法 * * 将 BD-09 坐标转换成GCJ-02 坐标 * * @param 
 * bd_lat * @param bd_lon * @return 
 */  
function bd09_To_Gcj02(lat, lon) {  
    let x = lon - 0.0065, y = lat - 0.006;  
    let z = Math.sqrt(x * x + y * y) - 0.00002 * Math.sin(y * x_pi);  
    let theta = Math.atan2(y, x) - 0.000003 * Math.cos(x * x_pi);  
    let tempLon = z * Math.cos(theta);  
    let tempLat = z * Math.sin(theta);  
    let gps = [tempLat,tempLon];  
    return gps;  
}  

/**将gps84转为bd09 
 * @param lat 
 * @param lon 
 * @return 
 */  
function gps84_To_bd09(lat,lon){  
    let gcj02 = gps84_To_Gcj02(lat,lon);  
    let bd09 = gcj02_To_Bd09(gcj02[0],gcj02[1]);  
    return bd09;  
}  

function bd09_To_gps84(lat,lon){  
    let gcj02 = bd09_To_Gcj02(lat, lon);  
    let gps84 = gcj02_To_Gps84(gcj02[0], gcj02[1]);  
    //保留小数点后六位  
    gps84[0] = gps84[0].toFixed(6);  
    gps84[1] = gps84[1].toFixed(6);  
    return gps84;  
}  

export {
    gps84_To_Gcj02,
    gcj02_To_Gps84
}