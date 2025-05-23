// Chakra imports
import {
  Box,
  SimpleGrid,
  useColorModeValue,
  Spinner,
  Text,
  Icon,
} from '@chakra-ui/react';
// Custom components
import MiniCalendar from 'components/calendar/MiniCalendar';
import MiniStatistics from 'components/card/MiniStatistics';
import IconBox from 'components/icons/IconBox';
import React, { useState, useEffect } from 'react';
import {
  MdCategory,
  MdRestaurantMenu,
  MdShoppingCart,
  MdMoney,
  MdAttachMoney,
} from 'react-icons/md';
import axios from 'axios';

export default function UserReports() {
  // Chakra Color Mode
  const brandColor = useColorModeValue('brand.500', 'white');
  const boxBg = useColorModeValue('secondaryGray.300', 'whiteAlpha.100');

  // State for API data, loading, and error
  const [dashboardData, setDashboardData] = useState({
    totalSubCategories: 0,
    totalMenuItems: 0,
    totalOrders: 0,
    codOrders: 0,
    onlineOrders: 0,
    codAmount: 0,
    onlineAmount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch data from API on component mount
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const baseUrl = process.env.REACT_APP_BASE_URL;
        const token = localStorage.getItem('token') || '';

        const response = await axios.get(
          `${baseUrl}api/admin/adminSubDashboardCount`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          },
        );

        const data = response.data.data || {};

        console.log('data', data);

        setDashboardData({
          totalSubCategories: data.totalSubCategories ?? 0,
          totalMenuItems: data.totalMenuItems ?? 0,
          totalOrders: data.totalOrders ?? 0,
          codOrders: data.codOrders ?? 0,
          onlineOrders: data.onlineOrders ?? 0,
          codAmount: data.codAmount ?? 0,
          onlineAmount: data.onlineAmount ?? 0,
        });
      } catch (err) {
        console.error('API Error:', err.response || err.message);
        setError('Failed to fetch dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  console.log('data2', dashboardData);

  if (loading) {
    return (
      <Box pt={{ base: '130px', md: '80px', xl: '80px' }} textAlign="center">
        <Spinner size="xl" color={brandColor} />
        <Text mt="4">Loading dashboard data...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box pt={{ base: '130px', md: '80px', xl: '80px' }} textAlign="center">
        <Text color="red.500">{error}</Text>
      </Box>
    );
  }

  return (
    <Box pt={{ base: '130px', md: '80px', xl: '80px' }}>
      <SimpleGrid
        columns={{ base: 1, md: 2, lg: 3, '2xl': 6 }}
        gap="20px"
        mb="20px"
      >
        <MiniStatistics
          startContent={
            <IconBox
              w="56px"
              h="56px"
              bg={boxBg}
              icon={
                <Icon as={MdCategory} w="32px" h="32px" color={brandColor} />
              }
            />
          }
          name="Sub Categories"
          value={dashboardData.totalSubCategories.toLocaleString()}
        />
        <MiniStatistics
          startContent={
            <IconBox
              w="56px"
              h="56px"
              bg={boxBg}
              icon={
                <Icon
                  as={MdRestaurantMenu}
                  w="32px"
                  h="32px"
                  color={brandColor}
                />
              }
            />
          }
          name="Menu Items"
          value={dashboardData.totalMenuItems.toLocaleString()}
        />
        <MiniStatistics
          startContent={
            <IconBox
              w="56px"
              h="56px"
              bg={boxBg}
              icon={
                <Icon
                  as={MdShoppingCart}
                  w="32px"
                  h="32px"
                  color={brandColor}
                />
              }
            />
          }
          name="Total Orders"
          value={dashboardData.totalOrders.toLocaleString()}
        />
        <MiniStatistics
          startContent={
            <IconBox
              w="56px"
              h="56px"
              bg={boxBg}
              icon={<Icon as={MdMoney} w="32px" h="32px" color={brandColor} />}
            />
          }
          name="COD Orders"
          value={dashboardData.codOrders.toLocaleString()}
        />
        <MiniStatistics
          startContent={
            <IconBox
              w="56px"
              h="56px"
              bg={boxBg}
              icon={
                <Icon as={MdAttachMoney} w="32px" h="32px" color={brandColor} />
              }
            />
          }
          name="Online Orders"
          value={dashboardData.onlineOrders.toLocaleString()}
        />
        <MiniStatistics
          startContent={
            <IconBox
              w="56px"
              h="56px"
              bg={boxBg}
              icon={<Icon as={MdMoney} w="32px" h="32px" color={brandColor} />}
            />
          }
          name="COD Amount"
          value={`₹${dashboardData.codAmount.toLocaleString()}`}
        />
        <MiniStatistics
          startContent={
            <IconBox
              w="56px"
              h="56px"
              bg={boxBg}
              icon={
                <Icon as={MdAttachMoney} w="32px" h="32px" color={brandColor} />
              }
            />
          }
          name="Online Amount"
          value={`₹${dashboardData.onlineAmount.toLocaleString()}`}
        />
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, md: 1, xl: 2 }} gap="20px" mb="20px">
        <MiniCalendar h="100%" minW="100%" selectRange={false} />
      </SimpleGrid>
    </Box>
  );
}
