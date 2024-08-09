import { useQuery } from "@apollo/client"
import { gql } from "apollo-boost"
import { getLocalTime } from "@/lib/datetime"
import { useContext } from "react"
import { AppContext } from "@/context/AppContext"

const query = gql`
  {
    chats(pagination: { limit: 100 }, sort: "updatedAt:asc"){
      data{
        id
        attributes{
          user{
            data{
              id
              attributes{
                username
              }
            }
         }
        text
        updatedAt
        }
      }
    }
  }
`

const Find = () => {
  const appContext = useContext(AppContext)
  if (!appContext) {
    throw new Error("Sidebar must be used within an AppProvider")
  }
  const { user } = appContext

  const { loading, error, data } = useQuery(query)

  if (loading) return <p>Loading...</p>
  if (error) {
    console.error("Error fetching messages:", error)
    return <p>Error: {error.message}</p>
  }

  return (
    <div className="space-y-4">
      {data.chats.data.map((chat) => {
        try {
          const localTime = getLocalTime(chat.attributes.updatedAt)
          const isOwnMessage = chat.attributes.user.data.id == user?.id

          return (
            <div
              key={chat.id}
              className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
            >
              <div className="flex flex-col">
                <div className={`text-sm text-blueGray-400 ${isOwnMessage ? "flex justify-end" : ""}`}>
                  <span className="whitespace-nowrap">
                    {localTime}
                  </span>
                  <span className="ml-2 text-lightBlue-500">
                    {chat.attributes.user.data.attributes.username}
                  </span>
                </div>
                <p
                  className={`max-w-xs lg:max-w-md px-2 py-1 mt-1 rounded-lg shadow-xl whitespace-pre-wrap break-words ${
                    isOwnMessage
                      ? "bg-blueGray-600 text-white"
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  {chat.attributes.text}
                </p>
              </div>
            </div>
          )
        } catch (e) {
          console.error("Error processing chat:", chat, e)
          return <p key={chat.id}>Error displaying chat</p>
        }
      })}
    </div>
  )
}

export default Find