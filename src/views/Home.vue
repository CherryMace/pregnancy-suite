<template>
  <div>
    <v-row dense>
      <v-col cols="12" md="4">
        <v-card tile link to="contraction-timer">
          <v-img
            src="../../public/pregnant-mother.jpg"
            class="white--text align-end"
            gradient="to bottom, rgba(0,0,0,.1), rgba(0,0,0,.5)"
            height="300px"
            >
            <v-card-title>
              <v-icon color="white" class="mr-2">mdi-clock</v-icon>
              Contraction Timer
            </v-card-title>
          </v-img>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card tile link to="diaper-logger">
          <v-img
            src="../../public/baby.jpg"
            class="white--text align-end"
            gradient="to bottom, rgba(0,0,0,.1), rgba(0,0,0,.5)"
            height="300px"
            >
            <v-card-title>
              <v-icon color="white" class="mr-2">mdi-human-baby-changing-table</v-icon>
              Diaper Logger
            </v-card-title>
          </v-img>
        </v-card>
      </v-col>
      <v-col cols="12" md="4" v-if="false">
        <v-card tile link color="secondary">
          <v-img
            class="white--text align-end"
            height="300px"
            >
            <v-card-title>
              <v-icon color="white" class="mr-2">mdi-cog</v-icon>
              Settings
            </v-card-title>
          </v-img>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script>
export default {
  name: 'Home'
}
</script>
