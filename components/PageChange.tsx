import React, { useState, useEffect } from "react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faBars, faCircleNotch } from "@fortawesome/free-solid-svg-icons"

const PageChange : React.FC = () => {
  return (
    <div className=" mx-auto md:ml-64">
      <div className="top-0 left-0 w-full h-full block z-50 absolute bg-blueGray-50"></div>
      <div className="my-32 mx-auto max-w-sm text-center relative z-50 top-0">
        <div className="block mb-4">
          <FontAwesomeIcon
            icon={faCircleNotch}
            className="animate-spin text-blueGray-800 mx-auto  text-6xl"
          />
        </div>
        <h4 className="text-lg font-medium text-blueGray-800">
          Loading...
        </h4>
      </div>
    </div>
  )
}

export default PageChange