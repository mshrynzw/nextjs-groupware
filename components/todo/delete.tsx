import { deletedTodo } from "@/lib/api/todo"
import { formatTime, getLocalTime } from "@/lib/datetime"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faSnowflake, faTrash } from "@fortawesome/free-solid-svg-icons"
import React from "react"

const Delete = ({ deleteTodo, setScreen, refetch }) => {
  const handleDelete = async () => {
    await deletedTodo(deleteTodo.id)
    refetch()
    setScreen("find")
  }

  const createdAt = getLocalTime(deleteTodo.attributes.createdAt)
  const updatedAt = getLocalTime(deleteTodo.attributes.updatedAt)

  return (
    <div className="flex items-center justify-center h-full">
      <div className="w-full max-w bg-white shadow-xl rounded-xl m-8 xl:mx-64 p-8">
        <h1
          className="mb-8 text-blueGray-800 border-b-4 border-blueGray-800 bg-white font-bold uppercase text-center py-1 outline-none focus:outline-none mr-1 w-full ease-linear"
        >
          <FontAwesomeIcon
            icon={faTrash}
            className={
              "fas fa-tv mr-2"
            }
          />
          Delete
        </h1>

        <label htmlFor="name"
               className="block uppercase text-blueGray-600 text-sm font-bold mb-2"
        >
          <FontAwesomeIcon
            icon={faSnowflake}
            className={
              "fas fa-tv mr-2 text-sm text-blueGray-300"
            }
          />{" "}
          Name
        </label>
        <p
          className="border-0 px-2 py-2 mb-8 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
        >
          {deleteTodo.attributes.name}
        </p>

        <label htmlFor="description"
               className="block uppercase text-blueGray-600 text-sm font-bold mb-2"
        >
          <FontAwesomeIcon
            icon={faSnowflake}
            className={
              "fas fa-tv mr-2 text-sm text-blueGray-300"
            }
          />{" "}
          Description
        </label>
        <p
          className="border-0 px-2 py-2 mb-8 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
        >
          {deleteTodo.attributes.description}
        </p>

        <div className="md:space-x-4 md:flex md:flex-row">
          <div className="flex basis-1/3 flex-col">
            <label htmlFor="Priority"
                   className="mb-2 block text-sm font-bold uppercase text-blueGray-600"
            >
              <FontAwesomeIcon
                icon={faSnowflake}
                className={
                  "fas fa-tv mr-2 text-sm text-blueGray-300"
                }
              />{" "}
              Priority
            </label>
            <div className="flex md:justify-center">
              <input type="number" name="priority" id="priority" value={String(deleteTodo.attributes.priority)} min="1" max="5"
                     className="mb-8 w-20 rounded border-0 bg-white px-2 py-2 text-center text-sm shadow transition-all duration-150 ease-linear placeholder-blueGray-300 text-blueGray-600 focus:outline-none focus:ring"
                     disabled={true}
              />
            </div>
          </div>
          <div className="flex flex-col md:basis-1/3">
            <label htmlFor="due"
                   className="mb-2 block text-sm font-bold uppercase text-blueGray-600"
            >
              <FontAwesomeIcon
                icon={faSnowflake}
                className={
                  "fas fa-tv mr-2 text-sm text-blueGray-300"
                }
              />{" "}
              Due
            </label>
            <div className="flex md:justify-center">
              <input type="datetime-local" name="due" id="due" value={formatTime(deleteTodo.attributes.due)}
                     className="mb-8 w-48 rounded border-0 bg-white px-2 py-2 text-center text-sm shadow transition-all duration-150 ease-linear placeholder-blueGray-300 text-blueGray-600 focus:outline-none focus:ring"
                     disabled={true}
              />
            </div>
          </div>
          <div className="flex flex-col md:basis-1/3">
            <label htmlFor="check"
                   className="mb-2 block text-sm font-bold uppercase text-blueGray-600"
            >
              <FontAwesomeIcon
                icon={faSnowflake}
                className={
                  "fas fa-tv mr-2 text-sm text-blueGray-300"
                }
              />{" "}
              Check
            </label>
            <div className="mb-8 flex h-full md:justify-center">
              <input type="checkbox" name="check" id="check" checked={deleteTodo.attributes.check}
                     className="h-6 w-6 scale-150 rounded border-0 shadow focus:ring focus:ring-blue-500 focus:ring-opacity-50 focus:ring-offset-0"
                     disabled={true}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-row space-x-4">
          <div className="flex basis-1/2 flex-col">
            <label htmlFor="updated"
                   className="mb-2 block text-sm font-bold uppercase text-blueGray-600"
            >
              <FontAwesomeIcon
                icon={faSnowflake}
                className={
                  "fas fa-tv mr-2 text-sm text-blueGray-300"
                }
              />{" "}
              Created
            </label>
            <div className="flex items-end justify-between pb-8">
              <p className="text-sm text-blueGray-400">
                {createdAt}
              </p>
            </div>
          </div>
          <div className="flex basis-1/2 flex-col">
            <label htmlFor="updated"
                   className="mb-2 block text-sm font-bold uppercase text-blueGray-600"
            >
              <FontAwesomeIcon
                icon={faSnowflake}
                className={
                  "fas fa-tv mr-2 text-sm text-blueGray-300"
                }
              />{" "}
              Updated
            </label>
            <div className="flex items-end justify-between pb-8">
              <p className="text-sm text-blueGray-400">
                {updatedAt}
              </p>
            </div>
          </div>
        </div>

        <button onClick={handleDelete}
                className="bg-blueGray-800 text-white text-sm font-bold uppercase px-6 py-3 rounded-xl shadow-xl outline-none focus:outline-none mr-1 mb-1 w-full ease-linear"
        >
          Submit
        </button>
      </div>
    </div>
  )
}

export default Delete
