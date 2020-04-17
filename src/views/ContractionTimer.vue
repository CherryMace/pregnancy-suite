<template>
  <div>
    <v-expand-transition>
      <v-btn block color="success" class="d-none d-md-flex" @click="startContraction" v-if="!currentContractionStartTime">Start Contraction</v-btn>
      <v-row v-else>
        <v-col>
          <v-card outlined>
            <v-card-title primary-title class="overline">
              New Contraction
              <v-spacer></v-spacer>
              <v-btn icon small @click="cancelContraction">
                <v-icon small>mdi-close</v-icon>
              </v-btn>
            </v-card-title>
            <v-card-text class="text-center">
              <h4 class="display-1">{{ currentContractionStartTime ? millisecondsToHoursMinutesSeconds(now - currentContractionStartTime) : '' }}</h4>
            </v-card-text>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn dark block color="orange darken-2" depressed @click="stopContraction">End Contraction</v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
    </v-expand-transition>
    <v-row>
      <v-col>
        <v-card>
          <v-card-title class="subtitle-1">
            Contractions In the Past Hour...
          </v-card-title>
          <v-card-text>
            <v-row>
              <v-col class="text-center">
                <div class="headline" :class="pastHourAverageFrequencyClasses">{{ millisecondsToHoursMinutesSeconds(pastHourAverageFrequency) }}</div>
                <span class="overline">Average Frequency</span>
              </v-col>
              <v-col class="text-center">
                <div class="headline" :class="pastHourAverageDurationClasses">{{ millisecondsToHoursMinutesSeconds(pastHourAverageDuration) }}</div>
                <span class="overline">Average Duration</span>
              </v-col>
            </v-row>
          </v-card-text>
          <v-card-title primary-title class="subtitle-1">
            Contraction Log
          </v-card-title>
          <v-card-text v-if="contractions.length">
            <v-simple-table>
              <template v-slot:default>
                <thead>
                  <tr>
                    <th class="text-left">Time</th>
                    <th class="text-left">Duration</th>
                    <th class="text-right"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="contraction in todayContractions.reverse()" :key="`c_${contraction.startTime}-${contraction.endTime}`">
                    <td>{{ contraction.startTime.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true }) }}</td>
                    <td>{{ millisecondsToHoursMinutesSeconds(contraction.endTime.getTime() - contraction.startTime.getTime()) }}</td>
                    <td class="text-right"><v-btn icon @click.stop="promptDeleteContraction(contraction.id)"><v-icon>mdi-delete</v-icon></v-btn></td>
                  </tr>
                  <tr v-if="yesterdayContractions.length && todayContractions.length"><th colspan="3">Yesterday</th></tr>
                  <tr v-for="contraction in yesterdayContractions.reverse()" :key="`c_${contraction.startTime}-${contraction.endTime}`">
                    <td><span v-if="!todayContractions.length">Yesterday, </span>{{ contraction.startTime.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true }) }}</td>
                    <td>{{ millisecondsToHoursMinutesSeconds(contraction.endTime.getTime() - contraction.startTime.getTime()) }}</td>
                    <td class="text-right"><v-btn icon @click.stop="promptDeleteContraction(contraction.id)"><v-icon>mdi-delete</v-icon></v-btn></td>
                  </tr>
                  <tr v-if="earlierContractions.length && (todayContractions.length || yesterdayContractions.length)"><th colspan="3">Earlier</th></tr>
                  <tr v-for="contraction in earlierContractions" :key="`c_${contraction.startTime}-${contraction.endTime}`">
                    <td>{{ contraction.startTime.toLocaleString('en-US', { hour12: true }) }}</td>
                    <td>{{ millisecondsToHoursMinutesSeconds(contraction.endTime.getTime() - contraction.startTime.getTime()) }}</td>
                    <td class="text-right"><v-btn icon @click.stop="promptDeleteContraction(contraction.id)"><v-icon>mdi-delete</v-icon></v-btn></td>
                  </tr>
                </tbody>
              </template>
            </v-simple-table>
          </v-card-text>
          <v-card-text v-else class="text-center">
            <em>No contractions recorded</em>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    <v-fab-transition>
      <v-btn fab dark fixed bottom right color="success" class="d-inline-flex d-md-none" @click="startContraction" v-if="!currentContractionStartTime">
        <v-icon dark>mdi-plus</v-icon>
      </v-btn>
    </v-fab-transition>
    <v-dialog v-model="deleteDialog" max-width="500" transition="dialog-transition">
      <v-card>
        <v-card-title class="headline">
          Delete Contraction?
        </v-card-title>
        <v-card-text>
          This will discard the selected contraction's information. This cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="closeDeleteContraction">No</v-btn>
          <v-btn color="error" depressed text @click="deleteContraction">Yes</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { v4 as uuidv4 } from 'uuid'

export default {
  data: () => ({
    deleteDialog: false,
    deleteId: null,
    now: null,
    nowInterval: null,
    contractions: [
      // {
      //   id: uuidv4,
      //   startTime: datetime,
      //   endTime: datetime
      // }
    ],
    currentContractionStartTime: null
  }),
  computed: {
    timeSinceLastContraction () {
      if (!this.contractions.length) return ''

      const lastStartTime = this.contractions[this.contractions.length - 1].startTime
      const difference = this.now - lastStartTime

      const thirtySeconds = 30000
      const oneMinute = thirtySeconds * 2
      const twoMinutes = oneMinute * 2

      if (difference < thirtySeconds) return 'a few seconds ago'
      if (difference < oneMinute) return 'less than a minute ago'
      if (difference < twoMinutes) return 'a minute ago'
      return `${Math.floor(difference / 1000 / 60)} minutes ago`
    },
    lastContractionDuration () {
      if (!this.contractions.length) return ''

      const lastContraction = this.contractions[this.contractions.length - 1]
      const duration = lastContraction.endTime - lastContraction.startTime
      return this.millisecondsToHoursMinutesSeconds(duration)
    },
    todayContractions () {
      if (this.now === null) return []

      return this.contractions.filter(c => this.isToday(c.startTime))
    },
    yesterdayContractions () {
      if (this.now === null) return []

      return this.contractions.filter(c => this.isYesterday(c.startTime))
    },
    earlierContractions () {
      if (this.now === null) return []

      return this.contractions.filter(c => !this.isToday(c.startTime) && !this.isYesterday(c.startTime))
    },
    pastHourOfContractions () {
      if (this.now === null) return []

      const oneHourAgo = new Date(this.now).setTime(this.now.getTime() - (60 * 60 * 1000))

      return this.contractions.filter(c => c.startTime > oneHourAgo)
    },
    pastHourAverageFrequency () {
      return this.averageFrequency(this.pastHourOfContractions)
    },
    pastHourAverageFrequencyClasses () {
      if (this.pastHourAverageFrequency === 0) return ''
      if (this.pastHourAverageFrequency < (3.15 * 60 * 1000)) return 'red--text font-weight-bold'
      if (this.pastHourAverageFrequency < (4.15 * 60 * 1000)) return 'orange--text text--darken-2 font-weight-bold'
      if (this.pastHourAverageFrequency < (5.15 * 60 * 1000)) return 'yellow--text text--darken-3 font-weight-bold'
      return ''
    },
    pastHourAverageDuration () {
      return this.averageDuration(this.pastHourOfContractions)
    },
    pastHourAverageDurationClasses () {
      if (this.pastHourAverageDuration === 0) return ''
      if (this.pastHourAverageDuration > (60 * 1000)) return 'red--text font-weight-bold'
      if (this.pastHourAverageDuration > (55 * 1000)) return 'orange--text text--darken-2 font-weight-bold'
      if (this.pastHourAverageDuration > (50 * 1000)) return 'yellow--text text--darken-3 font-weight-bold'
      return ''
    }
  },
  methods: {
    saveContractionLog () {
      localStorage.setItem('contractions', JSON.stringify(this.contractions))
    },
    loadContractionLog () {
      let contractions = JSON.parse(localStorage.getItem('contractions'))

      if (!contractions) return

      contractions = contractions.map(c => ({ ...c, startTime: new Date(c.startTime), endTime: new Date(c.endTime) }))

      this.contractions = contractions
    },
    updateNow () {
      this.now = new Date()
    },
    startContraction () {
      this.updateNow()
      this.currentContractionStartTime = new Date(this.now)
    },
    stopContraction () {
      this.contractions = [
        ...this.contractions,
        {
          id: uuidv4(),
          startTime: this.currentContractionStartTime,
          endTime: new Date()
        }
      ]
      this.currentContractionStartTime = null
      this.saveContractionLog()
    },
    cancelContraction () {
      this.currentContractionStartTime = null
      this.dialog = false
    },
    promptDeleteContraction (id) {
      this.deleteId = id
      this.deleteDialog = true
    },
    closeDeleteContraction () {
      this.deleteId = null
      this.deleteDialog = false
    },
    deleteContraction () {
      this.contractions = this.contractions.filter(c => c.id !== this.deleteId)
      this.deleteId = null
      this.deleteDialog = false
      this.saveContractionLog()
    },
    millisecondsToHoursMinutesSeconds (milliseconds) {
      if (milliseconds === 0) return '-'

      const hours = Math.floor(milliseconds / 1000 / 60 / 60)
      const minutes = Math.floor(milliseconds / 1000 / 60 % 60)
      const seconds = Math.floor(milliseconds / 1000 % 60)

      // return `${hours ? `${hours} hour${hours > 1 ? 's' : ''} ` : ''}${minutes ? `${minutes} minute${minutes > 1 ? 's' : ''} ` : ''}${seconds} second${seconds !== 1 ? 's' : ''}`
      return `${hours ? `${hours}h ` : ''}${minutes ? `${minutes}m ` : ''}${seconds}s`
    },
    averageFrequency (contractions) {
      if (contractions.length < 2) return 0

      const totalFrequency = Math.abs(contractions[0].startTime - contractions[contractions.length - 1].startTime)

      return totalFrequency / (contractions.length - 1)
    },
    averageDuration (contractions) {
      if (contractions.length < 2) return 0

      const totalDuration = contractions.reduce((total, c) => total + (c.endTime - c.startTime), 0)

      return totalDuration / contractions.length
    },
    isToday (date) {
      return date.getDate() === this.now.getDate() &&
        date.getMonth() === this.now.getMonth() &&
        date.getFullYear() === this.now.getFullYear()
    },
    isYesterday (date) {
      const yesterday = new Date(this.now)
      yesterday.setDate(yesterday.getDate() - 1)

      return date.getDate() === yesterday.getDate() &&
        date.getMonth() === yesterday.getMonth() &&
        date.getFullYear() === yesterday.getFullYear()
    }
  },
  created () {
    this.loadContractionLog()

    this.nowInterval = setInterval(() => {
      this.updateNow()
    }, 100)
  },
  destroyed () {
    clearInterval(this.nowInterval)
  }
}
</script>

<style>
.v-data-table tbody tr th {
  background-color: #fff!important;
}
</style>
