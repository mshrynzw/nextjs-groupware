import { useState } from "react"
import { createTimecardSetting } from "@/lib/api/setting/timecard"

const Create = () => {
  const [name, setName] = useState<string>("")
  const [description, setDescription] = useState<string>("")
  const [order, setOrder] = useState<number>(0)
  const [color, setColor] = useState<string>("#FFFFFF")

  const handleSend = async () => {
    try {
      await createTimecardSetting(name, description, order, color)
      setName("")
      setDescription("")
      setOrder(0)
      setColor("#FFFFFF")
    } catch (error) {
      console.log(error.response.data.error.message)
    }
  }

  return (
    <>
      <h2>Create</h2>
      <form
        onSubmit={async (e) => {
          await handleSend()
        }}
      >
        <label htmlFor="name">Name</label>
        <input type="text" name="name" id="name" maxLength="8" required onChange={(e) => setName(e.target.value)}/>
        <label htmlFor="description">Description</label>
        <input type="text" name="description" id="description" onChange={(e) => setDescription(e.target.value)}/>
        <label>Order</label>
        <input type="number" name="order" id="order" required onChange={(e) => setOrder(Number(e.target.value))}/>
        <label htmlFor="color">Color</label>
        <input type="color" name="color" id="color" value={color} required onChange={(e) => setColor(e.target.value)}/>
        <button type="submit">Submit</button>
      </form>
    </>
  )
}

export default Create
