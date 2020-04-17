<template>
  <div>
    <v-card>
      <v-card-text>
        <v-row no-gutters class="justify-space-between">
            <v-btn icon large color="success" @click="$refs.calendar.prev()"><v-icon>mdi-chevron-left</v-icon></v-btn>
            <span class="d-flex align-center title">{{ month }} {{ year }}</span>
            <v-btn icon large color="success" @click="$refs.calendar.next()"><v-icon>mdi-chevron-right</v-icon></v-btn>
        </v-row>
        <v-calendar ref="calendar" type="month" v-model="value" @click:day="clickDate" @click:date="clickDate" @change="updateDisplayDate" :show-month-on-first="false">
          <template v-slot:day="{ outside, date }">
            <v-sheet class="text-center pa-1" color="transparent" v-if="diaperLog[date]">
              <v-chip dark link :color="`brown ${outside ? 'lighten-2' : 'darken-1'}`" class="d-block mb-1">
                <v-avatar left class="d-none d-sm-inline"><v-icon>mdi-emoticon-poop</v-icon></v-avatar>
                {{ diaperLog[date].soiled }}
              </v-chip>
              <v-chip dark link :color="`amber ${outside ? 'lighten-2' : 'darken-1'}`" class="d-block">
                <v-avatar left class="d-none d-sm-inline"><v-icon>mdi-water</v-icon></v-avatar>
                {{ diaperLog[date].wet }}
              </v-chip>
              <v-chip dark link :color="`blue ${outside ? 'lighten-2' : ''}`" class="d-block mt-1" v-if="diaperLog[date].notes">
                <v-avatar left><v-icon>mdi-note</v-icon></v-avatar>
                <span class="d-inline-block text-truncate">{{ diaperLog[date].notes }}</span>
              </v-chip>
            </v-sheet>
            <v-sheet class="text-center pa-1 d-flex align-center" height="100%" width="100%" v-else-if="!outside">
              <v-btn block text color="primary" class="fill-height pa-0"><v-icon>mdi-plus</v-icon></v-btn>
            </v-sheet>
          </template>
        </v-calendar>
      </v-card-text>
    </v-card>
    <v-dialog
      v-model="editDialog"
      :overlay="false"
      max-width="500px"
      persistent
      transition="dialog-transition"
    >
      <v-card>
        <v-card-title>
          {{ diaperLog[editDate] ? 'Edit' : 'Add' }} Log
        </v-card-title>
        <v-card-subtitle>
          {{ formatDate(editDate) }}
        </v-card-subtitle>
        <v-card-text>
          <v-form v-model="validLog">
            <v-text-field
              v-model="log.soiled"
              type="number"
              pattern="[0-9]*"
              solo
              flat
              class="text-center"
              prepend-icon="mdi-emoticon-poop"
              prepend-inner-icon="mdi-minus"
              @click:prepend-inner="incrementSoiled(-1)"
              append-icon="mdi-plus"
              @click:append="incrementSoiled(1)"
              @change="clampSoiled"></v-text-field>
            <v-text-field
              v-model="log.wet"
              type="number"
              pattern="[0-9]*"
              solo
              flat
              class="text-center"
              prepend-icon="mdi-water"
              prepend-inner-icon="mdi-minus"
              @click:prepend-inner="incrementWet(-1)"
              append-icon="mdi-plus"
              @click:append="incrementWet(1)"
              @change="clampWet"></v-text-field>
            <v-text-field
              outlined
              v-model="log.notes"
              label="Notes"
              counter
              maxlength="50"
              :rules="noteRules"
            ></v-text-field>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="closeLog">Cancel</v-btn>
          <v-dialog
            v-model="promptDelete"
            max-width="250px"
            transition="dialog-transition"
            v-if="diaperLog[editDate]"
          >
            <template v-slot:activator="{ on }">
              <v-btn depressed color="error" v-on="on">Delete</v-btn>
            </template>
            <v-card>
              <v-card-title>
                Delete Log?
              </v-card-title>
              <v-card-text>
                This will remove all information from this day's log and cannot be undone.
              </v-card-text>
              <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn text @click="promptDelete = false">No</v-btn>
                <v-btn depressed color="error" @click="deleteLog">Yes</v-btn>
              </v-card-actions>
            </v-card>
          </v-dialog>
          <v-btn depressed color="primary" @click.stop="saveLog">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
export default {
  data: () => ({
    value: '',
    diaperLog: {
      // '2020-04-15': {
      //   soiled: 2,
      //   wet: 1,
      //   notes: 'This is a pretty long note, all things considered'
      // }
    },
    month: '',
    year: null,
    editDialog: false,
    promptDelete: false,
    validLog: true,
    noteRules: [
      v => v.length <= 50 || 'Your notes must be less than 50 characters'
    ],
    editDate: '',
    log: {
      soiled: 0,
      wet: 0,
      notes: ''
    },
    defaultLog: {
      soiled: 0,
      wet: 0,
      notes: ''
    },
    maxSoiled: 25,
    maxWet: 25
  }),
  methods: {
    clickDate (e) {
      this.editLog(e.date)
    },
    editLog (date) {
      this.log = Object.assign({}, (this.diaperLog[date] || this.defaultLog))
      this.editDate = date
      this.editDialog = true
    },
    newLog () {
      this.log = Object.assign({}, this.defaultLog)
    },
    closeLog () {
      this.promptDelete = false
      this.editDialog = false
      setTimeout(() => {
        this.newLog()
      }, 200)
    },
    deleteLog () {
      const diaperLog = { ...this.diaperLog }
      delete diaperLog[this.editDate]
      this.diaperLog = diaperLog
      this.saveLogsToStorage()
      this.closeLog()
    },
    saveLog () {
      if (!this.validLog) return

      this.diaperLog[this.editDate] = this.log
      this.saveLogsToStorage()

      this.closeLog()
    },
    saveLogsToStorage () {
      localStorage.setItem('diaperLog', JSON.stringify(this.diaperLog))
    },
    loadLogsFromStorage () {
      const diaperLog = JSON.parse(localStorage.getItem('diaperLog'))

      if (!diaperLog) return

      this.diaperLog = diaperLog
    },
    incrementSoiled (val) {
      let soiled = parseInt(this.log.soiled)
      soiled += val
      soiled = Math.max(soiled, 0)
      soiled = Math.min(soiled, this.maxSoiled)
      this.log.soiled = soiled
    },
    incrementWet (val) {
      let wet = parseInt(this.log.wet)
      wet += val
      wet = Math.max(wet, 0)
      wet = Math.min(wet, this.maxWet)
      this.log.wet = wet
    },
    clampSoiled () {
      let soiled = parseInt(this.log.soiled)
      if (isNaN(soiled)) soiled = 0
      soiled = Math.max(soiled, 0)
      soiled = Math.min(soiled, this.maxSoiled)
      this.log.soiled = soiled
    },
    clampWet () {
      let wet = parseInt(this.log.wet)
      if (isNaN(wet)) wet = 0
      wet = Math.max(wet, 0)
      wet = Math.min(wet, this.maxWet)
      this.log.wet = wet
    },
    formatDate (dateToFormat) {
      const date = new Date(dateToFormat)
      return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    },
    updateDisplayDate (e) {
      const months = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December'
      ]
      this.month = months[e.start.month - 1]
      this.year = e.start.year
    },
    numbersOnly (e) {
      console.log(e)
    }
  },
  created () {
    this.loadLogsFromStorage()
  }
}
</script>

<style>
.v-calendar-weekly__day {
  display: flex;
  flex-direction: column;
}

.fill-height {
  height: 100%!important;
}

.v-input.text-center input {
  text-align: center;
}

/* Chrome, Safari, Edge, Opera */
input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

/* Firefox */
input[type=number] {
  -moz-appearance: textfield;
}
</style>
