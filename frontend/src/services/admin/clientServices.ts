import { axiosInstance } from "@/config/axios.config";
import { API } from "@/constants/api.constant";
import type { UserDetail } from "@/types/dtos/user.dto";


export const getUsers = async (search: string, page: number, limit: number, filter: string = 'all') => {
  const response = await axiosInstance.get(API.ADMIN.GET_USERS, {
    params: { search, page, limit, filter }
  });
  return response.data;
};

export const getUserDetails = async (userId: string): Promise<UserDetail> => {
  try {
    const response = await axiosInstance.get(API.ADMIN.GET_USER_DETAILS(userId), { withCredentials: true });
    return response.data.user;
  } catch (error: unknown) {
    console.error('Error fetching user details:', error);
    const message =
      typeof error === 'object' &&
      error !== null &&
      'response' in error &&
      typeof (error as { response?: { data?: { message?: unknown } } }).response?.data?.message === 'string'
        ? ((error as { response?: { data?: { message?: string } } }).response?.data?.message as string)
        : 'Failed to fetch user details';
    throw new Error(message);
  }
};

export const blockUser = async (userId: string): Promise<boolean> => {
  try {
    await axiosInstance.patch(API.ADMIN.BLOCK_USER(userId));
    return true;
  } catch (error: unknown) {
    const message =
      typeof error === 'object' &&
      error !== null &&
      'response' in error &&
      typeof (error as { response?: { data?: { message?: unknown } } }).response?.data?.message === 'string'
        ? ((error as { response?: { data?: { message?: string } } }).response?.data?.message as string)
        : error instanceof Error
          ? error.message
          : 'Error blocking user';
    console.error("Error blocking user:", message);
    return false;
  } 
};

export const unblockUser = async (userId: string): Promise<boolean> => {
  try {
    await axiosInstance.patch(API.ADMIN.UNBLOCK_USER(userId));
    return true;
  } catch (error: unknown) {
    const message =
      typeof error === 'object' &&
      error !== null &&
      'response' in error &&
      typeof (error as { response?: { data?: { message?: unknown } } }).response?.data?.message === 'string'
        ? ((error as { response?: { data?: { message?: string } } }).response?.data?.message as string)
        : error instanceof Error
          ? error.message
          : 'Error unblocking user';
    console.error("Error unblocking user:", message);
    return false;
  }
};