import { deletedGroup } from "@/lib/api/setting/group"
import { getLocalTime } from "@/lib/datetime"

const Delete = ({ deleteGroup, setScreen, refetch }) => {
  const handleDelete = async () => {
    await deletedGroup(deleteGroup.id)
    refetch()
    setScreen("find")
  }

  const localTime = getLocalTime(deleteGroup.attributes.updatedAt)

  return (
    <div>
      <h2>Delete</h2>
      <h3>{deleteGroup.attributes.name}</h3>
      <p>Updated at {localTime}</p>
      <ul>
        {deleteGroup.attributes.users.data.map((user) => {
          return (
            <li key={user.id}>user.attributes.username</li>
          )
        })}
      </ul>
      <button onClick={handleDelete}>Delete</button>
    </div>
  )
}

export default Delete
