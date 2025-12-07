import React from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { routes } from '../../routes/index.route'

function Allroutes() {
  const router = createBrowserRouter(routes);
  return <RouterProvider router={router} />
}

export default Allroutes