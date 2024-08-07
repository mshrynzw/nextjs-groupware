import { useContext, useState } from "react"
import { AppContext } from "@/context/AppContext"
import { postMessage } from "@/lib/api/chat"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faPenToSquare } from "@fortawesome/free-solid-svg-icons"

const Create =()=>{
  const appContext = useContext(AppContext)
  if (!appContext) {
    throw new Error("Sidebar must be used within an AppProvider")
  }
  const { user } = appContext
  const [sendMessage, setSendMessage] = useState("")
  const handleSend = async () => {
    try {
      if (user) {
        await postMessage(user, sendMessage)
      }
      setSendMessage("")
    } catch (error) {
      console.log(error.response.data.error.message)
    }
  }

  return (
    <div className="fixed right-0 bottom-0 left-0 m-0 w-full bg-white p-4 shadow-xl md:pl-72">
      <form
        onSubmit={async (e) => {
          await handleSend()
        }}
      >
        <div className="flex items-center space-x-4">
          <textarea
            name="text"
            id="text"
            rows="3"
            className="flex-grow rounded border-0 bg-white px-2 py-2 text-sm shadow transition-all duration-150 ease-linear placeholder-blueGray-300 text-blueGray-600 focus:outline-none focus:ring"
            onChange={(e) => setSendMessage(e.target.value)}
          />
          <button
            type="submit"
            className="flex-shrink-0 rounded-lg px-6 py-3 text-sm font-bold uppercase text-white shadow outline-none transition-all duration-150 ease-linear bg-blueGray-800 hover:shadow-lg focus:outline-none"
          >
            <FontAwesomeIcon
              icon={faPenToSquare}
              className="h-6 w-6 p-1"
            />
          </button>
        </div>
      </form>
    </div>
  )
}

export default Create