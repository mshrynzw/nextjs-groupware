import { deletedTimecardSetting } from "@/lib/api/setting/timecard"
import { getLocalTime } from "@/lib/datetime"

const Delete = ({ deleteTimecardSetting, setScreen, refetch }) => {
  const handleDelete = async () => {
    await deletedTimecardSetting(deleteTimecardSetting.id)
    refetch()
    setScreen("find")
  }

  const localTime = getLocalTime(deleteTimecardSetting.attributes.updatedAt)

  return (
    <div>
      <h2>Delete</h2>
      <h3>{deleteTimecardSetting.attributes.name}</h3>
      <p>{localTime}</p>
      <p>{deleteTimecardSetting.attributes.description}</p>
      <p>{String(deleteTimecardSetting.attributes.order)}</p>
      <p>{deleteTimecardSetting.attributes.color}</p>
      <button onClick={handleDelete}>Submit</button>
    </div>
  )
}

export default Delete
