import React, { useEffect } from "react"
import { gql } from "apollo-boost"
import { useQuery } from "@apollo/client"
import { faGear, faEllipsis, faTrash } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { getLocalTime } from "@/lib/datetime"

const query = gql`
  {
    infos(pagination: { limit: 10 }, sort: "updatedAt:desc"){
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
          title
          body
          updatedAt
        }
      }
    }
  }
`

const Find = ({ setScreen, setEditInfo, setDeleteInfo, refetchFlag }) => {
  const { loading, error, data, refetch } = useQuery(query)

  useEffect(() => {
    refetch()
  }, [refetchFlag])

  const handleEdit = (info) => {
    setEditInfo(info)
    setScreen("edit")
  }

  const handleDelete = (info) => {
    setDeleteInfo(info)
    setScreen("delete")
  }

  if (loading) return <p>Loading...</p>
  if (error) {
    console.error("Error fetching messages:", error)
    return <p>Error: {error.message}</p>
  }

  return (
    <div className="relative py-12">
      <div className="mx-auto w-full px-4 md:px-10">
        <div className="flex flex-wrap">
          {data.infos.data.map((info) => {
            try {
              const updatedTime = getLocalTime(info.attributes.updatedAt)
              return (
                <div key={info.id} className="w-full px-4 py-4 xl:w-6/12">
                  <div className="relative mb-6 flex min-w-0 flex-col break-words rounded bg-white shadow-lg xl:mb-0">
                    <div className="flex-auto p-4">
                      <div className="flex flex-wrap">
                        <div className="relative w-full max-w-full flex-1 flex-grow pr-4">
                            <span className="text-xl font-semibold text-blueGray-700">
                              {info.attributes.title}
                            </span>
                          <h5 className="text-xs font-bold text-blueGray-400">
                            {info.attributes.body}
                          </h5>
                        </div>
                      </div>
                      <div className="mt-4 flex items-end justify-between">
                        <p className="text-sm text-blueGray-400">
                            <span className="whitespace-nowrap">
                              {updatedTime}
                            </span>
                          <span className="ml-2 text-lightBlue-500">
                              {info.attributes.user.data.attributes.username}
                            </span>
                        </p>
                        <div className="mt-2 flex justify-end">
                          <button
                            onClick={() => handleEdit(info)}
                            className="mr-2 flex h-8 w-8 items-center justify-center rounded-md p-2 text-white shadow-sm bg-blueGray-700 hover:bg-blueGray-400 hover:shadow-xl"
                          >
                            <FontAwesomeIcon icon={faEllipsis}/>
                          </button>
                          <button
                            onClick={() => handleDelete(info)}
                            className="flex h-8 w-8 items-center justify-center rounded-md p-2 text-white shadow-sm bg-blueGray-700 hover:bg-blueGray-400 hover:shadow-xl"
                          >
                            <FontAwesomeIcon icon={faTrash}/>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            } catch (e) {
              console.error("Error processing message:", info, e)
              return <p key={info.id}>Error displaying message</p>
            }
          })}
        </div>
      </div>
    </div>
  )
}

export default Find