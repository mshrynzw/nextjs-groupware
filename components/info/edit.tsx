import { useState } from "react"
import { editedInfo } from "@/lib/api/info"

const Edit = ({ editInfo, setScreen, refetch }) => {
  const [title, setTitle] = useState<string>(editInfo.attributes.title)
  const [body, setBody] = useState<string>(editInfo.attributes.body)

  const handleEdit = async () => {
    await editedInfo(editInfo.id, title, body)
    refetch()
    setScreen("find")
  }

  const localTime = new Date(editInfo.attributes.updatedAt).toLocaleString()

  return (
    <div>
      <h2>Edit</h2>
      <form
        onSubmit={async (e) => {
          e.preventDefault()
          await handleEdit()
        }}
      >
        <label htmlFor="title">Title</label>
        <input
          type="text"
          name="title"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <p>{localTime}</p>
        <p>{editInfo.attributes.user.data.attributes.username}</p>
        <label htmlFor="body">Body</label>
        <input
          type="text"
          name="body"
          id="body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
        <button type="submit">Submit</button>
      </form>
    </div>
  )
}

export default Edit
