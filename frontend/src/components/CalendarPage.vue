<template>
  <div class="parent">
    <div class="month-selector">
      <div class="display-month">{{ displayMonth }}</div>
      <button @click="previousMonth">
        <span class="material-symbols-outlined"> arrow_back_ios_new </span>
      </button>
      <button @click="nextMonth">
        <span class="material-symbols-outlined"> arrow_forward_ios </span>
      </button>
    </div>
    <div class="yobi">
      <div v-for="(yobi, index) in yobi" :key="index" class="yobi-child">
        {{ yobi }}
      </div>
    </div>
    <div v-for="(week, index) in weeks" :key="index" class="week">
      <div
        v-for="(day, index) in week"
        :key="index"
        class="day"
        :class="{ 'other-month': day.getMonth() !== month.month }"
      >
        <div class="day-number">
          {{ day.getDate() }}
        </div>
        <div v-for="event in events" :key="event.id" class="event-container">
          <div
            v-if="isEventOnDay(event, day)"
            class="event"
            :style="`background-color:${event.color}; width: ${calculateWidth(
              event,
              day
            )}vw;
            top: ${calculateTop(event, day)}em;`"
            draggable="true"
          >
            {{ event.name }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import axios from "axios";
import moment from "moment";
import { DISPLAY_DAY_LENGTH } from "@/constants";

moment.locale("ja");

export default {
  data() {
    return {
      DISPLAY_DAY_LENGTH,
      currentDate: moment(),
      yobi: ["日", "月", "火", "水", "木", "金", "土"],
      weeks: [],
      month: {
        month: new Date().getMonth(),
        year: new Date().getFullYear(),
      },
      users: null,
      events: [],
    };
  },
  methods: {
    async fetchEvents() {
      try {
        const response = await axios.get("/events");
        this.events = response.data;
      } catch (error) {
        console.error("イベントの取得に失敗しました:", error);
      }
    },
    /*
      当月(アクセス月)に表示する日付を表現する2次元配列を返す
      日曜始まり。週に含まれる前月次月の日付も補完する。
      月の日数に関わらず6行(週)固定。
      初週の日曜日から+35日固定で取得する。
      例) 2023/10/1~11/11
    */
    getWeeksOfMonth(year, month) {
      const weeks = [];
      const monthFirstDay = moment([year, month - 1]);
      const displayFirstDay = moment(monthFirstDay).startOf("week").toDate();
      const displayEndDay = moment(displayFirstDay).add(
        DISPLAY_DAY_LENGTH,
        "days"
      );

      let currentDay = moment(displayFirstDay);
      let week = [];

      while (
        currentDay.isBefore(displayEndDay) ||
        currentDay.isSame(displayEndDay)
      ) {
        week.push(currentDay.toDate());

        if (currentDay.day() === 6) {
          weeks.push(week);
          week = [];
        }

        currentDay = currentDay.add(1, "days");
      }

      return weeks;
    },
    previousMonth() {
      const newMonth = this.month.month - 1;
      const newYear = newMonth === -1 ? this.month.year - 1 : this.month.year;
      this.month = {
        month: newMonth === -1 ? 11 : newMonth,
        year: newYear,
      };
    },
    nextMonth() {
      const newMonth = this.month.month + 1;
      const newYear = newMonth === 12 ? this.month.year + 1 : this.month.year;
      this.month = {
        month: newMonth === 12 ? 0 : newMonth,
        year: newYear,
      };
    },
    /**
     * 特定のイベントについて対象日に表示するか真偽値を返す
     * 日曜日の場合、週またぎのイベントかチェック
     * 日曜含むその他、その日始まりのイベントかチェック
     * TODO: 週またぎはまたぎ前と何等かの紐づけが必要
     */
    isEventOnDay(event, day) {
      const startDate = moment(event.start).startOf("day");
      const endDate = moment(event.end).startOf("day");
      const dayDate = moment(day).startOf("day");

      if (dayDate.day() === 0 && startDate <= dayDate && endDate >= dayDate) {
        // またぎイベント
        return true;
      } else {
        return startDate.isSame(dayDate, "day");
      }
    },
    /**
     * 週またぎの場合、開始日は該当週の日曜日で計算する
     * それ以外は、開始日～終了日で計算する
     * 最大値は14vw * 7(日)
     */
    calculateWidth(event, day) {
      const startDate = moment(event.start).startOf("day");
      const endDate = moment(event.end).startOf("day");
      const dayDate = moment(day).startOf("day");

      let duration; // 表示期間
      let maxDuration; //表示最大期間
      if (dayDate.day() === 0 && startDate <= dayDate && endDate >= dayDate) {
        // またぎイベントは週初めから~終了日の期間
        duration = endDate.diff(dayDate, "days") + 1;
        maxDuration = 7 - dayDate.day();
      } else {
        duration = endDate.diff(startDate, "days") + 1;
        maxDuration = 7 - startDate.day();
      }

      if (duration > maxDuration) {
        duration = maxDuration;
      }

      return 14 * duration;
    },
    /**
     * 対象イベントの下向きオフセット値を返す
     * eventsがソートされている前提で処理する
     * イベントは「通常」、「またぎ」の「表示単位」で表示行番号を持っている
     * 該当日に表示されているイベントの表示行番号以外で最も小さい番号を該当イベントの表示行とする
     * 例)イベント1は1行目表示、イベント2は3行目表示の場合、イベント3は2行目表示になりうる
     * n * 1.4em
     * TODO:最大表示数
     */
    calculateTop(event, day) {
      let line = 0;
      let array = [];

      for (const element of this.events) {
        if (element.id === event.id) {
          // 自身の要素の場合
          break;
        }

        const startDate = moment(element.start).startOf("day");
        const endDate = moment(element.end).startOf("day");
        const dayDate = moment(day).startOf("day");

        if (startDate <= dayDate && endDate >= dayDate) {
          // 自分より早い開始日かつ同じ以上の終了日のイベントの場合、表示行を特定して配列に追加
          array.push(this.calculateDisplayLine(element));
        }
      }
      // 表示行数配列に存在しない最小の正の整数を表示行に設定
      line = this.findSmallestMissingPositiveInteger(array);

      return line * 1.4;
    },
    /**
     * イベントの表示行数を返す
     */
    calculateDisplayLine(event) {
      let line = 0;
      for (let i = 0; i < this.events.length; i++) {
        if (this.events[i].id === event.id) {
          // 自身の場合
          break;
        }

        const startDate = moment(this.events[i].start).startOf("day");
        const endDate = moment(this.events[i].end).startOf("day");
        const start = moment(event.start).startOf("day");

        if (startDate <= start && endDate >= start) {
          // 自身より上に表示されているか
          ++line;
        }
      }
      return line;
    },
    /**
     * 配列に存在しない最小の正の整数を返す
     *
     * @param {} array
     */
    findSmallestMissingPositiveInteger(array) {
      if (array.length === 0) {
        return 0;
      }

      let minPositive = 1;

      for (let i = 0; i < array.length; i++) {
        // 現在の要素が minPositive と同じなら、minPositive を増やす
        if (array[i] === minPositive) {
          minPositive++;
        }
      }

      return minPositive;
    },
  },
  computed: {
    displayMonth() {
      return `${this.month.year}年${this.month.month + 1}月`;
    },
  },
  mounted() {
    // +1 は、getMonth()が0から始まるため
    this.weeks = this.getWeeksOfMonth(this.month.year, this.month.month + 1);
    this.env = process.env.VUE_APP_USE_MOCK;
    this.fetchEvents();
  },
  watch: {
    month(newMonth) {
      // +1 は、getMonth()が0から始まるため
      this.weeks = this.getWeeksOfMonth(newMonth.year, newMonth.month + 1);
    },
  },
};
</script>
<style scoped>
.parent {
  display: flex;
  flex-direction: column;
  height: 97vh; /* viewport height */
}

.calendar {
  flex-grow: 1; /* Grow to take up all available space */
  display: flex;
  flex-direction: column;
}

.display-month {
  min-width: 100px;
}

.yobi {
  display: flex;
}

.week {
  height: 16vh;
  display: flex;
}

.day {
  width: 14vw;
  border: 0.5px solid #ccc;
  display: flex;
  flex-direction: column;
}

/* Optional: Add some padding inside each day cell */
.day > .day-number,
.yobi > .yobi-child {
  width: 100%;
  text-align: center;
  font-size: 10px;
}

.other-month {
  color: #7f7f7f;
  background-color: #e2e2e2;
}

.month-selector {
  display: flex;
  align-items: center;
  margin-bottom: 5px;
}

.month-selector > button {
  padding: 5px 10px;
  cursor: pointer;
  border-radius: 50%;
  color: #565656;
}

.month-selector > button > span {
  font-size: 18px;
}

.month-selector > button:hover {
  background-color: #fdfdfd;
}

.event-container {
  position: relative;
}
.event {
  font-size: 10px;
  font-weight: bold;
  padding: 2px 0px;
  position: absolute;
}
</style>
