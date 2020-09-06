def buildNumber = env.BUILD_NUMBER as int
if (buildNumber > 1) milestone(buildNumber - 1)
milestone(buildNumber)

pipeline {
    agent { label 'node' }

    stages {
        stage('Install dependencies') {
            steps {
                sh 'npm i'
            }
        }

        stage('Test') {
            steps {
                sh 'npm run test'
            }
            post {
                always {
                    junit 'junit.xml'
                }
            }
        }
    }
}
