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
