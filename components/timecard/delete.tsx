import { deletedTimecard } from "@/lib/api/timecard"

const Delete = ({ deleteTimecard, setScreen, refetch }) => {
  const handleDelete = async () => {
    await deletedTimecard(deleteTimecard.id)
    refetch()
    setScreen("find")
  }

  return (
    <div>
      <h2>Delete</h2>
      <h3>{new Date(deleteTimecard.attributes.date).toLocaleDateString()}</h3>
      <p>{deleteTimecard.attributes.type.data.attributes.name}</p>
      <p>{new Date(deleteTimecard.attributes.startWork).toLocaleTimeString()}</p>
      <p>{new Date(deleteTimecard.attributes.startBreak).toLocaleTimeString()}</p>
      <p>{new Date(deleteTimecard.attributes.endBreak).toLocaleTimeString()}</p>
      <p>{new Date(deleteTimecard.attributes.endWork).toLocaleTimeString()}</p>
      <button onClick={handleDelete}>Submit</button>
    </div>
  )
}

export default Delete
