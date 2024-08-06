export const getDatesInCurrentMonth = () : Date[] => {
  const dates : Date[] = []
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()

  // 月の最初の日
  const firstDay = new Date(year, month, 1)
  // 月の最後の日
  const lastDay = new Date(year, month + 1, 0)

  for (let day = firstDay; day <= lastDay; day.setDate(day.getDate() + 1)) {
    dates.push(new Date(day))
  }

  return dates
}

export const getLocalTime = (datetime) : string => {
  return new Date(datetime).toLocaleString("ja-JP", {
    year : "numeric",
    month : "2-digit",
    day : "2-digit",
    hour : "2-digit",
    minute : "2-digit",
    hour12 : false
  })
}

export const getTodayTime = () => {
  const now = new Date()
  now.setMinutes(0)

  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  const hours = String(now.getHours() + 1).padStart(2, "0")

  return `${year}-${month}-${day}T${hours}:00`
}

export const formatTime = (datetime : string) : string => {
  const dt = new Date(datetime)
  const year = dt.getFullYear()
  const month = String(dt.getMonth() + 1).padStart(2, "0")
  const day = String(dt.getDate()).padStart(2, "0")
  const hours = String(dt.getHours()).padStart(2, "0")
  const minutes = String(dt.getMinutes()).padStart(2, "0")

  return `${year}-${month}-${day}T${hours}:${minutes}`
}

export const formatTimeWithoutYear = (datetime : string) : string => {
  const dt = new Date(datetime)
  const month = String(dt.getMonth() + 1).padStart(2, "0")
  const day = String(dt.getDate()).padStart(2, "0")
  const hours = String(dt.getHours()).padStart(2, "0")
  const minutes = String(dt.getMinutes()).padStart(2, "0")

  return `${month}/${day} ${hours}:${minutes}`
}
