import { useState } from "react"
import { editedTimecardSetting } from "@/lib/api/setting/timecard"

const Edit = ({ editTimecardSetting, setScreen, refetch }) => {
  const [name, setName] = useState<string>(editTimecardSetting.attributes.name)
  const [description, setDescription] = useState<string>(editTimecardSetting.attributes.description)
  const [order, setOrder] = useState<number>(Number(editTimecardSetting.attributes.order))
  const [color, setColor] = useState<string>(editTimecardSetting.attributes.color)

  const handleEdit = async () => {
    await editedTimecardSetting(editTimecardSetting.id, name, description, order, color)
    refetch()
    setScreen("find")
  }

  const localTime = new Date(editTimecardSetting.attributes.updatedAt).toLocaleString()

  return (
    <div>
      <h2>Edit</h2>
      <form
        onSubmit={async (e) => {
          e.preventDefault()
          await handleEdit()
        }}
      >
        <label htmlFor="name">Name</label>
        <input type="text" name="name" id="name" maxLength="8" value={name} required onChange={(e) => setName(e.target.value)}/>
        <label htmlFor="description">Description</label>
        <input type="text" name="description" id="description" value={description} onChange={(e) => setDescription(e.target.value)}/>
        <label>Order</label>
        <input type="number" name="order" id="order" value={order} required onChange={(e) => setOrder(Number(e.target.value))}/>
        <label htmlFor="color">Color</label>
        <input type="color" name="color" id="color" value={color} required onChange={(e) => setColor(e.target.value)}/>
        <button type="submit">Submit</button>
      </form>
    </div>
  )
}

export default Edit
