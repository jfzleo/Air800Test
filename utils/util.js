const formatDateTime = date => {
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    const hour = date.getHours()
    const minute = date.getMinutes()
    const second = date.getSeconds()

    return [year, month, day].map(formatNumber).join('-') + ' ' + [hour, minute, second].map(formatNumber).join(':')
}

const formatDate = date => {
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()

    return [year, month, day].map(formatNumber).join('-')
}

const formatTime = date => {
    const hour = date.getHours()
    const minute = date.getMinutes()
    const second = date.getSeconds()

    return [hour, minute, second].map(formatNumber).join(':')
}

const formatTimeNoSecond = date => {
    const hour = date.getHours()
    const minute = date.getMinutes()
    // const second = date.getSeconds()

    return [hour, minute].map(formatNumber).join(':')
}

const formatDateTimeMilS = date => {
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    const hour = date.getHours()
    const minute = date.getMinutes()
    const second = date.getSeconds()
    const milSecond = date.getMilliseconds()

    return [year, month, day].map(formatNumber).join('-') + ' ' + [hour, minute, second].map(formatNumber).join(':')
        + '.' + format3Number(milSecond);
}

const formatNumber = n => {
    n = n.toString()
    return n[1] ? n : '0' + n
}
const format3Number = n => {
    n = n.toString()
    return n[2] ? n : n[1] ? '0' + n : '00' + n;
}

// ArrayBuffer转16进度字符串示例
function ab2Hex(buffer) {
    const hexArr = Array.prototype.map.call(
        new Uint8Array(buffer),
        function (byte) {
            return ('00' + byte.toString(16)).slice(-2)
        }
    )
    return hexArr.join('')
}

function byte2SignedInt(byte) {
    if (byte > 127) {
        return byte - 256;
    } else {
        return byte;
    }
}

function bytes2SignedInt(hB, lB) {
  let value = (hB << 8) | lB;
  if (value > 32767) value -= 65536;
  return value;
}

function bytes2Int(hB, lB) {
    return (hB << 8) | lB;
}

function sortArrList(propertyName) {
    return function (object1, object2) {
        var value1 = object1[propertyName];
        var value2 = object2[propertyName];
        if (value1 < value2) {
            return -1;
        } else if (value1 > value2) {
            return 1;
        } else {
            return 0;
        }
    }
}

function inArray(arr, key, val) {
    for (let i = 0; i < arr.length; i++) {
        if (arr[i][key] === val) {
            return i
        }
    }
    return -1
}

function ascii(a) {
    return a.charCodeAt(0)
}

module.exports = {
    formatNumber,
    formatDateTime,
    formatDate,
    formatTime: formatTime,
    formatTimeNoSecond,
    formatDateTimeMilS,
    ab2Hex,
    inArray,
    byte2SignedInt,
    bytes2SignedInt,
    bytes2Int,
    sortArrList,
    ascii
}
