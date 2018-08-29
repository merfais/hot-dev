'use strict'

exports.log = (...args) => {
  console.log(...args)
}

exports.dateFormate = date => {
  function pad(value) {
    if ((value + '').length === 1) {
      return '0' + value
    }
    return value
  }
  const year = date.getFullYear()
  const month = pad(date.getMonth() + 1)
  const day = pad(date.getDate())
  const hours = pad(date.getHours())
  const minutes = pad(date.getMinutes())
  const seconds = pad(date.getSeconds())
  const miSeconds = date.getMilliseconds()
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${miSeconds}`
}
