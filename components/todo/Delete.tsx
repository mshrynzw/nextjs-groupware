import { deletedTodo } from "@/lib/api/todo"
import { formatDateTimeByStrapi, getLocalTime } from "@/lib/datetime"
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
    <div className="flex h-full items-center justify-center">
      <div className="m-8 w-full rounded-xl bg-white p-8 shadow-xl max-w xl:mx-64">
        <h1
          className="mr-1 mb-8 w-full border-b-4 bg-white py-1 text-center font-bold uppercase outline-none ease-linear text-blueGray-800 border-blueGray-800 focus:outline-none"
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
               className="mb-2 block text-sm font-bold uppercase text-blueGray-600"
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
          className="mb-8 w-full rounded border-0 bg-white px-2 py-2 text-sm shadow transition-all duration-150 ease-linear placeholder-blueGray-300 text-blueGray-600 focus:outline-none focus:ring"
        >
          {deleteTodo.attributes.name}
        </p>

        <label htmlFor="description"
               className="mb-2 block text-sm font-bold uppercase text-blueGray-600"
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
          className="mb-8 w-full rounded border-0 bg-white px-2 py-2 text-sm shadow transition-all duration-150 ease-linear placeholder-blueGray-300 text-blueGray-600 focus:outline-none focus:ring"
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
              <input type="datetime-local" name="due" id="due" value={formatDateTimeByStrapi(deleteTodo.attributes.due)}
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
                className="mr-1 mb-1 w-full rounded-xl px-6 py-3 text-sm font-bold uppercase text-white shadow-xl outline-none ease-linear bg-blueGray-800 focus:outline-none"
        >
          Submit
        </button>
      </div>
    </div>
  )
}

export default Delete
