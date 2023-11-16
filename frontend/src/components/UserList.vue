<script setup>
import { ref } from "vue";

const users = ref([]);

const getUsers = async () => {
  const response = await fetch("https://jsonplaceholder.typicode.com/users");
  const data = await response.json();
  users.value = data;
};

getUsers();
</script>
<template>
  <div>
    <h1>ユーザ一覧</h1>
    <ul>
      <li v-for="user in users" :key="user.id">
        {{ user.id }}.{{ user.name }}
      </li>
    </ul>
  </div>
</template>
