<template>
  <div>
    <CalendarPage />
    <!-- <UserList /> -->
  </div>
</template>

<script>
import CalendarPage from "./components/CalendarPage.vue";
// import UserList from './components/UserList.vue';

export default {
  name: "App",
  components: {
    CalendarPage,
    // UserList
  },
};
</script>
