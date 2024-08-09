import React, { useContext, useState, useRef } from "react"
import { AppContext } from "@/context/AppContext"
import { createdInfo } from "@/lib/api/info"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faPenToSquare, faSnowflake, faFont, faFileAlt } from "@fortawesome/free-solid-svg-icons"
import { faMarkdown } from "@fortawesome/free-brands-svg-icons"
import Editor from "@/components/richtext/Editor"
import { OutputData } from "@editorjs/editorjs"

const Create = () => {
  const appContext = useContext(AppContext)
  if (!appContext) {
    throw new Error("Sidebar must be used within an AppProvider")
  }
  const { user } = appContext
  const [title, setTitle] = useState("")
  const [body, setBody] = useState<string | OutputData>("")
  const [activeTab, setActiveTab] = useState("text")
  const editorRef = useRef<{ save: () => Promise<OutputData> } | null>(null)

  const tabs = [
    { id: "text", icon: faFont, label: "Text" },
    { id: "richText", icon: faFileAlt, label: "Rich Text" },
    { id: "markdown", icon: faMarkdown, label: "Markdown" }
  ]

  const handleTabClick = (tabId: string, e: React.MouseEvent) => {
    e.preventDefault()
    setActiveTab(tabId)
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (user) {
        let finalBody: string = typeof body === 'string' ? body : JSON.stringify(body);
        if (activeTab === "richText" && editorRef.current) {
          finalBody = JSON.stringify(await editorRef.current?.save());
        }
        await createdInfo(user, title, finalBody, activeTab)
      }
      setTitle("")
      setBody("")
      // Editor.jsには直接setContentメソッドがないため、
      // 新しいEditorJSインスタンスを作成する必要があります
      // これは上記のEditorコンポーネントのuseEffect内で処理されます
    } catch (error) {
      console.error(error.response.data.error.message)
    }
  }

  return (
    <div className="flex h-full items-center justify-center">
      <div className="m-8 w-full rounded-xl bg-white p-8 shadow-xl max-w xl:mx-64">
        <h1 className="mr-1 mb-8 w-full border-b-4 bg-white py-1 text-center font-bold uppercase outline-none ease-linear text-blueGray-800 border-blueGray-800 focus:outline-none">
          <FontAwesomeIcon icon={faPenToSquare} className="fas fa-tv mr-2" />
          Create
        </h1>
        <form className="flex flex-col" onSubmit={handleSend}>
          <label htmlFor="title" className="mb-2 block text-sm font-bold uppercase text-blueGray-600">
            <FontAwesomeIcon icon={faSnowflake} className="fas fa-tv mr-2 text-sm text-blueGray-300" />{" "}
            Title
          </label>
          <input
            type="text" name="title" id="title" required placeholder="Enter your title here..."
            className="mb-8 w-full rounded border-0 bg-white px-2 py-2 text-sm shadow transition-all duration-150 ease-linear placeholder-blueGray-300 text-blueGray-600 focus:outline-none focus:ring"
            onChange={(e) => setTitle(e.target.value)}
            value={title}
          />
          <label htmlFor="body" className="mb-2 block text-sm font-bold uppercase text-blueGray-600">
            <FontAwesomeIcon icon={faSnowflake} className="fas fa-tv mr-2 text-sm text-blueGray-300" />{" "}
            Body
          </label>
          <div className="relative">
            <div className="absolute right-0 -top-10 flex">
              {tabs.map((tab) => (
                <button
                  key={tab.id} type="button"
                  className={`px-3 py-2 text-sm font-medium rounded-t-lg focus:outline-none ${
                    activeTab === tab.id
                      ? "bg-white text-blueGray-600 border-t border-x border-blueGray-200"
                      : "bg-blueGray-100 text-blueGray-500 hover:bg-blueGray-200"
                  }`}
                  onClick={(e) => handleTabClick(tab.id, e)}
                >
                  <FontAwesomeIcon icon={tab.icon} className="mr-2"/>
                  {tab.label}
                </button>
              ))}
            </div>
            {activeTab === "richText" ? (
              <Editor
                ref={editorRef}
                initialValue={typeof body === 'string' ? body : JSON.stringify(body)}
                onChange={(content) => setBody(content)}
              />
            ) : (
              <textarea
                name="body" id="body" rows="20"
                className="mb-8 w-full rounded border-0 bg-white px-2 py-2 text-sm shadow transition-all duration-150 ease-linear placeholder-blueGray-300 text-blueGray-600 focus:outline-none focus:ring"
                onChange={(e) => setBody(e.target.value)}
                placeholder={`Enter your ${activeTab} here...`}
                value={typeof body === 'string' ? body : JSON.stringify(body)}
              />
            )}
          </div>
          <button
            type="submit"
            className="mr-1 mb-1 w-full rounded-xl px-6 py-3 text-sm font-bold uppercase text-white shadow-xl outline-none ease-linear bg-blueGray-800 focus:outline-none"
          >
            Submit
          </button>
        </form>
      </div>
    </div>
  )
}

export default Create