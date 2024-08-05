import { useQuery } from "@apollo/client"
import { gql } from "apollo-boost"
import { getLocalTime } from "@/lib/datetime"
import { useContext } from "react"
import { AppContext } from "@/context/AppContext"

const query = gql`
  {
    messages(pagination: { limit: 100 }, sort: "updatedAt:asc"){
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
      {data.messages.data.map((message) => {
        try {
          const localTime = getLocalTime(message.attributes.updatedAt)
          const isOwnMessage = message.attributes.user.data.id == user?.id

          return (
            <div
              key={message.id}
              className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
            >
              <div className="flex flex-col">
                <div className={`text-sm text-blueGray-400 ${isOwnMessage ? "flex justify-end" : ""}`}>
                  <span className="whitespace-nowrap">
                    {localTime}
                  </span>
                  <span className="ml-2 text-lightBlue-500">
                    {message.attributes.user.data.attributes.username}
                  </span>
                </div>
                <div
                  className={`max-w-xs lg:max-w-md px-2 py-1 mt-1 rounded-lg shadow-xl ${
                    isOwnMessage
                      ? "bg-blueGray-600 text-white"
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  <p>{message.attributes.text}</p>
                </div>
              </div>
            </div>
          )
        } catch (e) {
          console.error("Error processing message:", message, e)
          return <p key={message.id}>Error displaying message</p>
        }
      })}
    </div>
  )
}

export default Find
