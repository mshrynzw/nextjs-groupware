import Sidebar from "./Sidebar"
import React from "react"

const Layout = ({ children } : { children : React.ReactNode }) => {
  return (
    <>
      <Sidebar/>
      <div className="relative bg-blueGray-50 md:ml-64">
        <main className="min-h-screen mx-auto w-full p-4 md:p-12">
          {children}
        </main>
      </div>
    </>
  )
}

export default Layout