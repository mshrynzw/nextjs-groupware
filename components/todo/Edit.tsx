import React, { useState } from "react"
import { editedTodo } from "@/lib/api/todo"
import { formatDateTimeByStrapi, getLocalTime } from "@/lib/datetime"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faEllipsis, faSnowflake } from "@fortawesome/free-solid-svg-icons"

const Edit = ({ editTodo, setScreen, refetch }) => {
  const [name, setName] = useState<string>(editTodo.attributes.name)
  const [description, setDescription] = useState<string>(editTodo.attributes.description)
  const [priority, setPriority] = useState<number>(editTodo.attributes.priority)
  const [check, setCheck] = useState<boolean>(editTodo.attributes.check)
  const [due, setDue] = useState<string>(formatDateTimeByStrapi(editTodo.attributes.due))

  const handleEdit = async () => {
    await editedTodo(editTodo.id, name, description, priority, check, due)
    refetch()
    setScreen("find")
  }

  const createdAt = getLocalTime(editTodo.attributes.createdAt)
  const updatedAt = getLocalTime(editTodo.attributes.updatedAt)

  return (
    <div className="flex h-full items-center justify-center">
      <div className="m-8 w-full rounded-xl bg-white p-8 shadow-xl max-w xl:mx-64">
        <h1
          className="mr-1 mb-8 w-full border-b-4 bg-white py-1 text-center font-bold uppercase outline-none ease-linear text-blueGray-800 border-blueGray-800 focus:outline-none"
        >
          <FontAwesomeIcon
            icon={faEllipsis}
            className={
              "fas fa-tv mr-2"
            }
          />
          Edit
        </h1>

        <form
          className="flex flex-col"
          onSubmit={async (e) => {
            e.preventDefault()
            await handleEdit()
          }}
        >
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
          <input type="text" name="name" id="name" value={name}
                 className="mb-8 w-full rounded border-0 bg-white px-2 py-2 text-sm shadow transition-all duration-150 ease-linear placeholder-blueGray-300 text-blueGray-600 focus:outline-none focus:ring"
                 onChange={(e) => setName(e.target.value)}
          />

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
          <textarea name="description" id="description" value={description}
                    className="mb-8 w-full rounded border-0 bg-white px-2 py-2 text-sm shadow transition-all duration-150 ease-linear placeholder-blueGray-300 text-blueGray-600 focus:outline-none focus:ring"
                    onChange={(e) => setDescription(e.target.value)}
          />

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
                <input type="number" name="priority" id="priority" value={String(priority)} min="1" max="5"
                       className="mb-8 w-20 rounded border-0 bg-white px-2 py-2 text-center text-sm shadow transition-all duration-150 ease-linear placeholder-blueGray-300 text-blueGray-600 focus:outline-none focus:ring"
                       onChange={(e) => setPriority(Number(e.target.value))}
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
                <input type="datetime-local" name="due" id="due" value={due}
                       className="mb-8 w-48 rounded border-0 bg-white px-2 py-2 text-center text-sm shadow transition-all duration-150 ease-linear placeholder-blueGray-300 text-blueGray-600 focus:outline-none focus:ring"
                       onChange={(e) => setDue(e.target.value)}
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
                <input type="checkbox" name="check" id="check" checked={check}
                       className="h-6 w-6 scale-150 rounded border-0 shadow focus:ring focus:ring-blue-500 focus:ring-opacity-50 focus:ring-offset-0"
                       onChange={(e) => setCheck(e.target.checked)}
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

          <button type="submit"
                  className="mr-1 mb-1 w-full rounded-xl px-6 py-3 text-sm font-bold uppercase text-white shadow-xl outline-none ease-linear bg-blueGray-800 focus:outline-none"
          >
            Submit
          </button>
        </form>
      </div>
    </div>
  )
}

export default Edit
