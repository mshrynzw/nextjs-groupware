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

export const getLocalTime = (datetime : string) : string => {
  return new Date(datetime).toLocaleString("ja-JP", {
    year : "numeric",
    month : "2-digit",
    day : "2-digit",
    hour : "2-digit",
    minute : "2-digit",
    hour12 : false
  })
}

export const getNow = () => {
  const now = new Date()
  now.setMinutes(0)

  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const date = String(now.getDate()).padStart(2, "0")
  const hours = String(now.getHours() + 1).padStart(2, "0")

  return `${year}-${month}-${date}T${hours}:00`
}

export const getOneHourAgo = () => {
  const now = new Date()
  now.setMinutes(0)

  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const date = String(now.getDate()).padStart(2, "0")
  const hours = String(now.getHours() + 2).padStart(2, "0")

  return `${year}-${month}-${date}T${hours}:00`
}

export const formatDateTimeByStrapi = (datetime : string) : string => {
  // 時間が24以上の場合、日付を1日進めて時間を調整する
  const [datePart, timePart] = datetime.split("T")
  let [hours, minutes] = timePart.split(":").map(Number)

  let dt = new Date(datePart)
  if (hours >= 24) {
    dt.setDate(dt.getDate() + Math.floor(hours / 24))
    hours = hours % 24
  }

  dt.setHours(hours, minutes)

  const year = dt.getFullYear()
  const month = String(dt.getMonth() + 1).padStart(2, "0")
  const date = String(dt.getDate()).padStart(2, "0")
  const formattedHours = String(dt.getHours()).padStart(2, "0")
  const formattedMinutes = String(dt.getMinutes()).padStart(2, "0")

  return `${year}-${month}-${date}T${formattedHours}:${formattedMinutes}`
}

export const formatDateTimeByEventCalender = (dt : string) => {
  const date = new Date(dt)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  const hours = String(date.getHours()).padStart(2, "0")
  const minutes = String(date.getMinutes()).padStart(2, "0")

  return `${year}-${month}-${day}T${hours}:${minutes}`
}

export const formatDate = (date : string) : string => {
  const dt = new Date(date)
  const yyyy = dt.getFullYear()
  const mm = String(dt.getMonth() + 1).padStart(2, "0")
  const dd = String(dt.getDate()).padStart(2, "0")

  return `${yyyy}-${mm}-${dd}`
}

export const formatTimeWithoutYear = (datetime : string) : string => {
  const dt = new Date(datetime)
  const month = String(dt.getMonth() + 1).padStart(2, "0")
  const date = String(dt.getDate()).padStart(2, "0")
  const hours = String(dt.getHours()).padStart(2, "0")
  const minutes = String(dt.getMinutes()).padStart(2, "0")

  return `${month}/${date} ${hours}:${minutes}`
}

export const formatMonthDateDay = (dt : Date) : string => {
  const month = String(dt.getMonth() + 1).padStart(2, "0")
  const date = String(dt.getDate()).padStart(2, "0")
  const day = String(dt.getDay())
  const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  return `${month}/${date} (${weekday[day]})`
}

export const formatTime = (dt : string) : string => {
  return new Date(dt).toLocaleTimeString([], { hour : "2-digit", minute : "2-digit" })
}

export const formatDateTimeMinute = (dtm : string) : string => {
  return new Date(dtm).toISOString().slice(0, 16)
}

export const getDayColor = (date : Date) => {
  const day = date.getDay()
  if (day === 0) return "text-red-500"
  if (day === 6) return "text-blue-500"
  return "text-gray-900"
}