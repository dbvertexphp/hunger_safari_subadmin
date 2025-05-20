import React from 'react';
import { Icon } from '@chakra-ui/react';
import {
  MdBarChart,
  // MdPerson,
  MdHome,
  MdLock,
  // MdOutlineShoppingCart,
	MdRestaurantMenu,
} from 'react-icons/md';

// Admin Imports
import MainDashboard from 'views/admin/dashboard';
import Subcategory from 'views/admin/subcategory';
// import Profile from 'views/admin/profile';
// import DataTables from 'views/admin/dataTables';

import Restaurant from 'views/admin/Restaurant';


// Auth Imports
import SignInCentered from 'views/auth/signIn';
// import { FaUtensils } from 'react-icons/fa';

const routes = [
  {
    name: 'Main Dashboard',
    layout: '/admin',
    path: '/dashboard',
    icon: <Icon as={MdHome} width="20px" height="20px" color="inherit" />,
    component: <MainDashboard />,
  },
  {
    name: 'Restaurants',
    layout: '/admin',
    icon: (
      <Icon as={MdRestaurantMenu} width="20px" height="20px" color="inherit" />
    ),
    path: '/restaurants',
    component: <Restaurant />,
  },
	{
    name: 'All SubCategory',
    layout: '/admin',
    icon: <Icon as={MdBarChart} width="20px" height="20px" color="inherit" />,
    path: '/subCategory',
    component: <Subcategory />,
  },
  // {
  //   name: 'NFT Marketplace',
  //   layout: '/admin',
  //   path: '/nft-marketplace',
  //   icon: (
  //     <Icon
  //       as={MdOutlineShoppingCart}
  //       width="20px"
  //       height="20px"
  //       color="inherit"
  //     />
  //   ),
  //   component: <NFTMarketplace />,
  //   secondary: true,
  // },
  // {
  //   name: 'Data Tables',
  //   layout: '/admin',
  //   icon: <Icon as={MdBarChart} width="20px" height="20px" color="inherit" />,
  //   path: '/data-tables',
  //   component: <DataTables />,
  // },
  // {
  //   name: 'Profile',
  //   layout: '/admin',
  //   path: '/profile',
  //   icon: <Icon as={MdPerson} width="20px" height="20px" color="inherit" />,
  //   component: <Profile />,
  // },
  {
    name: 'Sign In',
    layout: '/', // Updated for navigation purposes
    path: '/', // Updated for navigation purposes
    icon: <Icon as={MdLock} width="20px" height="20px" color="inherit" />,
    component: <SignInCentered />,
  },
];

export default routes;
