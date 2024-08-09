import React, { forwardRef, useEffect, useImperativeHandle, useRef } from "react"
import EditorJS, { OutputData } from "@editorjs/editorjs"
import { EDITOR_JS_TOOLS } from "@/lib/editorTools"

interface EditorProps {
  initialValue : string
  onChange : (content : OutputData) => void
}

const Editor = forwardRef<{ save : () => Promise<OutputData> }, EditorProps>(
  ({ initialValue, onChange }, ref) => {
    const editorRef = useRef<EditorJS | null>(null)

    useEffect(() => {
      if (!editorRef.current) {
        editorRef.current = new EditorJS({
          holder : "editorjs",
          tools : EDITOR_JS_TOOLS,
          data : initialValue ? JSON.parse(initialValue) : undefined,
          onChange : async () => {
            const content = await editorRef.current?.save()
            if (content) {
              onChange(await content)
            }
          }
        })
      }

      return () => {
        if (editorRef.current && typeof editorRef.current?.destroy === "function") {
          editorRef.current?.destroy()
        }
      }
    }, [])

    useImperativeHandle(ref, () => ({
      save : async () => {
        if (editorRef.current) {
          return editorRef.current?.save()
        }
        throw new Error("Editor is not initialized")
      }
    }))

    return <div id="editorjs"/>
  }
)

Editor.displayName = "Editor"

export default Editor