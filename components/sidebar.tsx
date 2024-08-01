import { useContext, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/router"
import { AppContext } from "@/context/AppContext"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faBars, faCheck, faCircleInfo, faClock, faHouse, faMessage, faPeopleGroup, faRightFromBracket, faRightToBracket, faTimes, faUser, faUserPlus } from "@fortawesome/free-solid-svg-icons"

const Sidebar = () => {
  const appContext = useContext(AppContext)
  if (!appContext) {
    throw new Error("Sidebar must be used within an AppProvider")
  }
  const { user, setUser } = appContext

  const [collapseShow, setCollapseShow] = useState("hidden")
  const router = useRouter()

  const handleLogout = () => {
    setUser(null)
    router.push("/login")
  }

  return (
    <>
      <nav className="md:left-0 md:block md:fixed md:top-0 md:bottom-0 md:overflow-y-auto md:flex-row md:flex-nowrap md:overflow-hidden shadow-xl bg-white flex flex-wrap items-center justify-between relative md:w-64 z-10 py-4 px-6">
        <div className="md:flex-col md:items-stretch md:min-h-full md:flex-nowrap px-0 flex flex-wrap items-center justify-between w-full mx-auto">
          {/*TODO*/}
          {/* Toggler */}
          <button
            className="cursor-pointer text-black opacity-50 md:hidden px-3 py-1 text-xl leading-none bg-transparent rounded border border-solid border-transparent"
            type="button"
            onClick={() => setCollapseShow("bg-white m-2 py-3 px-6")}
          >
            <FontAwesomeIcon icon={faBars}/>
          </button>


          {/* Collapse */}
          <div
            className={
              "md:flex md:flex-col md:items-stretch md:opacity-100 md:relative md:mt-4 md:shadow-none shadow absolute top-0 left-0 right-0 z-40 overflow-y-auto overflow-x-hidden h-auto items-center flex-1 rounded " +
              collapseShow
            }
          >
            {/* Collapse header */}
            <div className="md:min-w-full md:hidden block pb-4 mb-4 border-b border-solid border-blueGray-200">
              <div className="flex flex-wrap">
                <div className="w-6/12">
                  <Link href="/"
                        className="md:block text-left md:pb-2 text-blueGray-600 mr-0 inline-block whitespace-nowrap text-sm uppercase font-bold p-4 px-0"
                  >
                    GW

                  </Link>
                </div>
                <div className="w-6/12 flex justify-end">
                  <button
                    type="button"
                    className="cursor-pointer text-black opacity-50 md:hidden px-3 py-1 text-xl leading-none bg-transparent rounded border border-solid border-transparent"
                    onClick={() => setCollapseShow("hidden")}
                  >
                    <FontAwesomeIcon icon={faTimes}/>
                  </button>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <ul className="md:flex-col md:min-w-full flex flex-col list-none">

              <h6 className="md:min-w-full text-blueGray-500 text-xs uppercase font-bold block pt-1 pb-4 no-underline">
                Menu
              </h6>

              <li className="items-center">
                <Link
                  href="/"
                  className={
                    "text-xs uppercase py-3 font-bold block " +
                    (router.pathname.endsWith("/")
                      ? "text-lightBlue-500 hover:text-lightBlue-600"
                      : "text-blueGray-700 hover:text-blueGray-500")
                  }
                >
                  <FontAwesomeIcon
                    icon={faHouse}
                    className={
                      "fas fa-tv mr-2 text-sm " +
                      (router.pathname.endsWith("/")
                        ? "opacity-75"
                        : "text-blueGray-300")
                    }
                  />{" "}
                  Home
                </Link>
              </li>

              <li className="items-center">
                <Link
                  href="/info"
                  className={
                    "text-xs uppercase py-3 font-bold block " +
                    (router.pathname.indexOf("/info") !== -1
                      ? "text-lightBlue-500 hover:text-lightBlue-600"
                      : "text-blueGray-700 hover:text-blueGray-500")
                  }
                >
                  <FontAwesomeIcon
                    icon={faCircleInfo}
                    className={
                      "fas fa-tv mr-2 text-sm " +
                      (router.pathname.indexOf("/info") !== -1
                        ? "opacity-75"
                        : "text-blueGray-300")
                    }
                  />{" "}
                  Info
                </Link>
              </li>

              <li className="items-center">
                <Link
                  href="/chat"
                  className={
                    "text-xs uppercase py-3 font-bold block " +
                    (router.pathname.indexOf("/chat") !== -1
                      ? "text-lightBlue-500 hover:text-lightBlue-600"
                      : "text-blueGray-700 hover:text-blueGray-500")
                  }
                >
                  <FontAwesomeIcon
                    icon={faMessage}
                    className={
                      "fas fa-tv mr-2 text-sm " +
                      (router.pathname.indexOf("/chat") !== -1
                        ? "opacity-75"
                        : "text-blueGray-300")
                    }
                  />{" "}
                  Chat
                </Link>
              </li>

              <li className="items-center">
                <Link
                  href="/todo"
                  className={
                    "text-xs uppercase py-3 font-bold block " +
                    (router.pathname.indexOf("/todo") !== -1
                      ? "text-lightBlue-500 hover:text-lightBlue-600"
                      : "text-blueGray-700 hover:text-blueGray-500")
                  }
                >
                  <FontAwesomeIcon
                    icon={faCheck}
                    className={
                      "fas fa-tv mr-2 text-sm " +
                      (router.pathname.indexOf("/todo") !== -1
                        ? "opacity-75"
                        : "text-blueGray-300")
                    }
                  />{" "}
                  Todo
                </Link>
              </li>

              <li className="items-center">
                <Link
                  href="/timecard"
                  className={
                    "text-xs uppercase py-3 font-bold block " +
                    (router.pathname.indexOf("/timecard") !== -1
                      ? "text-lightBlue-500 hover:text-lightBlue-600"
                      : "text-blueGray-700 hover:text-blueGray-500")
                  }
                >
                  <FontAwesomeIcon
                    icon={faClock}
                    className={
                      "fas fa-tv mr-2 text-sm " +
                      (router.pathname.indexOf("/timecard") !== -1
                        ? "opacity-75"
                        : "text-blueGray-300")
                    }
                  />{" "}
                  Time Card
                </Link>
              </li>

              {/* Divider */}
              <hr className="my-4 md:min-w-full"/>

              <h6 className="md:min-w-full text-blueGray-500 text-xs uppercase font-bold block pt-1 pb-4 no-underline">
                Setting
              </h6>

              <li className="items-center">
                <Link
                  href="/setting/group"
                  className={
                    "text-xs uppercase py-3 font-bold block " +
                    (router.pathname.indexOf("/setting/group") !== -1
                      ? "text-lightBlue-500 hover:text-lightBlue-600"
                      : "text-blueGray-700 hover:text-blueGray-500")
                  }
                >
                  <FontAwesomeIcon
                    icon={faPeopleGroup}
                    className={
                      "fas fa-tv mr-2 text-sm " +
                      (router.pathname.indexOf("/setting/group") !== -1
                        ? "opacity-75"
                        : "text-blueGray-300")
                    }
                  />{" "}
                  Group
                </Link>
              </li>

              {/* Divider */}
              <hr className="my-4 md:min-w-full"/>

              <h6 className="md:min-w-full text-blueGray-500 text-xs uppercase font-bold block pt-1 pb-4 no-underline">
                Account
              </h6>

              {user ? (
                <li className="items-center">
                  <div
                    className={
                      "text-xs uppercase py-3 font-bold block text-blueGray-700 hover:text-blueGray-500"
                    }
                  >
                    <FontAwesomeIcon
                      icon={faUser}
                      className={
                        "fas fa-tv mr-2 text-sm opacity-75"
                      }
                    />{" "}
                    {user.username}
                  </div>
                </li>
              ) : (
                <li className="items-center">
                  <Link
                    href="/signup"
                    className={
                      "text-xs uppercase py-3 font-bold block " +
                      (router.pathname.indexOf("/signup") !== -1
                        ? "text-lightBlue-500 hover:text-lightBlue-600"
                        : "text-blueGray-700 hover:text-blueGray-500")
                    }
                  >
                    <FontAwesomeIcon
                      icon={faUserPlus}
                      className={
                        "fas fa-tv mr-2 text-sm " +
                        (router.pathname.indexOf("/signup") !== -1
                          ? "opacity-75"
                          : "text-blueGray-300")
                      }
                    />{" "}
                    Sign Up
                  </Link>
                </li>
              )}
              {user ? (
                <li className="items-center">
                  <button
                    className={
                      "text-xs uppercase py-3 font-bold block text-blueGray-700 hover:text-blueGray-500"}
                    onClick={handleLogout}>
                    <FontAwesomeIcon
                      icon={faRightFromBracket}
                      className={
                        "fas fa-tv mr-2 text-sm opacity-75"
                      }
                    />{" "}
                    Logout
                  </button>
                </li>
              ) : (
                <li className="items-center">
                  <Link
                    href="/login"
                    className={
                      "text-xs uppercase py-3 font-bold block " +
                      (router.pathname.indexOf("/login") !== -1
                        ? "text-lightBlue-500 hover:text-lightBlue-600"
                        : "text-blueGray-700 hover:text-blueGray-500")
                    }
                  >
                    <FontAwesomeIcon
                      icon={faRightToBracket}
                      className={
                        "fas fa-tv mr-2 text-sm " +
                        (router.pathname.indexOf("/login") !== -1
                          ? "opacity-75"
                          : "text-blueGray-300")
                      }
                    />{" "}
                    Login
                  </Link>
                </li>
              )}
            </ul>
          </div>
        </div>
      </nav>
    </>
  )
}

export default Sidebar
