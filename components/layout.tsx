import Sidebar from "././sidebar"
import React from "react"

const Layout = ({ children } : { children : React.ReactNode }) => {
  return (
    <>
      <Sidebar/>
      <div className="relative bg-blueGray-50 md:ml-64">
        <main className="h-screen mx-auto w-full px-4 md:px-10">
          {children}
        </main>
      </div>
    </>
  )
}

export default Layout