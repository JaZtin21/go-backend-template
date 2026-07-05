import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UiState {
    isSidebarOpen: boolean;
    isAddShopModalOpen: boolean; // 👈 Add this line
}

const initialState: UiState = {
    isSidebarOpen: false,
    isAddShopModalOpen: false, // 👈 Add this line
};

export const uiSlice = createSlice({
    name: 'ui',
    initialState,
    reducers: {
        toggleSidebar: (state) => {
            state.isSidebarOpen = !state.isSidebarOpen;
        },
        setSidebarOpen: (state, action: PayloadAction<boolean>) => {
            state.isSidebarOpen = action.payload;
        },
        // 👇 Add these actions to control the modal globally
        setAddShopModalOpen: (state, action: PayloadAction<boolean>) => {
            state.isAddShopModalOpen = action.payload;
        },
    },
});

export const { toggleSidebar, setSidebarOpen, setAddShopModalOpen } = uiSlice.actions;

export default uiSlice.reducer;
