
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { getPlayerStats } from "../services/blackjackService";
import { useMetaMask } from "../hooks/useMetaMask";
import { PlayerStats } from "../interfaces/IPlayer";




// Componente del Sidebar
export const Sidebar = () => {
  const location = useLocation()
  const isActive = (path: string) => location.pathname === path;
  const [balance, setBalance] = useState<string>('0')
  const { account } = useMetaMask();

  useEffect(()=>{
    
  const getPlayerBalance = async ()  => {
    if(account){
      const stats: PlayerStats = await getPlayerStats(account!)
      setBalance(stats.initialDeposit)
    }
  }
  getPlayerBalance();
  },[account])

    return (
       
      <aside className="h-screen w-64 bg-secondarygreen text-white fixed flex flex-col flex-1">
        <h1 className="text-2xl font-bold text-center py-6 border-b border-gray-700">
          ♠ ♥ ♣ ♦
        </h1>
        <nav className="flex flex-col mt-6 space-y-4 px-4">
          <Link
            to="/inicio"
            className={"py-2 px-4 rounded-lg  transition flex items-center gap-4 " + (isActive('/inicio') ? 'bg-gray-700':'hover:bg-gray-700')}
          >
            <svg className="w-10" viewBox="0 0 24 24" fill="#ffffff" stroke="#ffffff"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <title>Home</title> <g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"> <g id="Home"> <rect id="Rectangle" fill-rule="nonzero" x="0" y="0" width="24" height="24"> </rect> <path d="M5,10 L5,19 C5,19.5523 5.44772,20 6,20 L18,20 C18.5523,20 19,19.5523 19,19 L19,10" id="Path" stroke="#ffffff" stroke-width="2" stroke-linecap="round"> </path> <path d="M21,11 L12.307,4.23875 C12.1264,4.09832 11.8736,4.09832 11.693,4.23875 L3,11" id="Path" stroke="#ffffff" stroke-width="2" stroke-linecap="round"> </path> </g> </g> </g></svg> Inicio
          </Link>
          <Link
            to="/stats"
            className={"py-2 px-4 rounded-lg  transition flex items-center gap-4 " + (isActive('/stats') ? 'bg-gray-700':'hover:bg-gray-700')}
          >
            <svg className="w-10" viewBox="0 0 24 24" fill="#000000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <title>Overview</title> <g id="Overview" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"> <rect id="Container" x="0" y="0" width="24" height="24"> </rect> <path d="M19,10.5714286 L19,18 C19,19.1045695 18.1045695,20 17,20 L6,20 C4.8954305,20 4,19.1045695 4,18 L4,7 C4,5.8954305 4.8954305,5 6,5 L13.4285714,5 L13.4285714,5" id="shape-1" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="0,0"> </path> <path d="M18,7 C18.5522847,7 19,6.55228475 19,6 C19,5.44771525 18.5522847,5 18,5 C17.4477153,5 17,5.44771525 17,6 C17,6.55228475 17.4477153,7 18,7 Z" id="shape-2" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-dasharray="0,0"> </path> <path d="M8,15 L11,11 L13.000781,13 L16,9" id="shape-3" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="0,0"> </path> </g> </g></svg>
            Mis Estadísticas
          </Link>
          <Link
          to="/balance"
          className={"py-2 px-4 rounded-lg transition flex items-center gap-4 " + (isActive('/balance') ? 'bg-gray-700':'hover:bg-gray-700')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
          </svg>
          Mi Balance
          </Link>
          
          
          <Link
            to="/game"
            className={"py-2 px-4 rounded-lg  transition flex items-center gap-4 " + (isActive('/game') ? 'bg-gray-700':'hover:bg-gray-700')}
          >
            <svg className="w-10" viewBox="0 0 24 24" fill="none"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M9.4 7.53333C9.2 7.26667 8.8 7.26667 8.6 7.53333L6.225 10.7C6.09167 10.8778 6.09167 11.1222 6.225 11.3L8.6 14.4667C8.8 14.7333 9.2 14.7333 9.4 14.4667L11.775 11.3C11.9083 11.1222 11.9083 10.8778 11.775 10.7L9.4 7.53333Z" fill="#ffffff"></path> <path d="M4.09245 5.63868C4.03647 5.5547 4.03647 5.4453 4.09245 5.36133L4.79199 4.31202C4.89094 4.16359 5.10906 4.16359 5.20801 4.31202L5.90755 5.36132C5.96353 5.4453 5.96353 5.5547 5.90755 5.63867L5.20801 6.68798C5.10906 6.83641 4.89094 6.83641 4.79199 6.68798L4.09245 5.63868Z" fill="#ffffff"></path> <path d="M13.208 15.312C13.1091 15.1636 12.8909 15.1636 12.792 15.312L12.0924 16.3613C12.0365 16.4453 12.0365 16.5547 12.0924 16.6387L12.792 17.688C12.8909 17.8364 13.1091 17.8364 13.208 17.688L13.9075 16.6387C13.9635 16.5547 13.9635 16.4453 13.9075 16.3613L13.208 15.312Z" fill="#ffffff"></path> <path fill-rule="evenodd" clip-rule="evenodd" d="M1 4C1 2.34315 2.34315 1 4 1H14C15.1323 1 16.1181 1.62732 16.6288 2.55337L20.839 3.68148C22.4394 4.11031 23.3891 5.75532 22.9603 7.35572L19.3368 20.8787C18.908 22.4791 17.263 23.4288 15.6626 23L8.19849 21H4C2.34315 21 1 19.6569 1 18V4ZM17 18V4.72339L20.3213 5.61334C20.8548 5.75628 21.1714 6.30461 21.0284 6.83808L17.405 20.361C17.262 20.8945 16.7137 21.2111 16.1802 21.0681L15.1198 20.784C16.222 20.3403 17 19.261 17 18ZM4 3C3.44772 3 3 3.44772 3 4V18C3 18.5523 3.44772 19 4 19H14C14.5523 19 15 18.5523 15 18V4C15 3.44772 14.5523 3 14 3H4Z" fill="#ffffff"></path> </g></svg>
            Jugar
          </Link>
  
        </nav>
        <div className="mt-auto mb-2 py-4 px-8 border-t-1 border-gray-700 flex items-center gap-4">
        <svg className="w-10" viewBox="0 0 24 24" fill="none"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M18 8V7.2C18 6.0799 18 5.51984 17.782 5.09202C17.5903 4.71569 17.2843 4.40973 16.908 4.21799C16.4802 4 15.9201 4 14.8 4H6.2C5.07989 4 4.51984 4 4.09202 4.21799C3.71569 4.40973 3.40973 4.71569 3.21799 5.09202C3 5.51984 3 6.0799 3 7.2V8M21 12H19C17.8954 12 17 12.8954 17 14C17 15.1046 17.8954 16 19 16H21M3 8V16.8C3 17.9201 3 18.4802 3.21799 18.908C3.40973 19.2843 3.71569 19.5903 4.09202 19.782C4.51984 20 5.07989 20 6.2 20H17.8C18.9201 20 19.4802 20 19.908 19.782C20.2843 19.5903 20.5903 19.2843 20.782 18.908C21 18.4802 21 17.9201 21 16.8V11.2C21 10.0799 21 9.51984 20.782 9.09202C20.5903 8.71569 20.2843 8.40973 19.908 8.21799C19.4802 8 18.9201 8 17.8 8H3Z" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path> </g></svg>
          Balance: {balance} ETH
        </div>
      </aside>
    );
  };
  