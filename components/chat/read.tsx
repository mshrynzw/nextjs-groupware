import { useQuery } from "@apollo/client"
import { gql } from "apollo-boost"

const query = gql`
  {
    messages(pagination: { limit: 100 }, sort: "updatedAt:desc"){
      data{
        id
        attributes{
          user{
            data{
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

const Read = () => {
  const { loading, error, data } = useQuery(query)

  if (loading) return <p>Loading...</p>
  if (error) {
    console.error("Error fetching messages:", error)
    return <p>Error: {error.message}</p>
  }

  return (
    <>
      {data.messages.data.map((message) => {
        try {
          const localTime = new Date(message.attributes.updatedAt).toLocaleString()
          return (
            <div key={message.id}>
              <p>{localTime}</p>
              <p>{message.attributes.user.data.attributes.username}</p>
              <p>{message.attributes.text}</p>
            </div>
          )
        } catch (e) {
          console.error("Error processing message:", message, e)
          return <p key={message.id}>Error displaying message</p>
        }
      })}
    </>
  )
}

export default Read
