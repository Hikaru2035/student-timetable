pipeline {
    agent any

    options {
        skipDefaultCheckout(true)
        timestamps()
        disableConcurrentBuilds()
    }

    environment {
        BUILD_TAG_ID = "build-${BUILD_NUMBER}"
    }

    stages {

        stage('Checkout Source') {
            steps {
                checkout scm
            }
        }

        stage('Build App') {
            steps {
                sh '''
                    cd backend
                    npm ci

                    cd ../frontend
                    npm ci
                    npm run build
                '''
            }
        }

        stage('Build Docker Images') {
            steps {
                sh '''
                    docker build -t todo-backend:${BUILD_TAG_ID} backend
                    docker build -t todo-frontend:${BUILD_TAG_ID} frontend
                '''
            }
        }

        stage('Backup Active → Stable') {
            steps {
                sh '''
                    docker image inspect todo-backend:active >/dev/null 2>&1 \
                      && docker tag todo-backend:active todo-backend:stable || true

                    docker image inspect todo-frontend:active >/dev/null 2>&1 \
                      && docker tag todo-frontend:active todo-frontend:stable || true
                '''
            }
        }

        stage('Promote Build → Active') {
            steps {
                sh '''
                    docker tag todo-backend:${BUILD_TAG_ID} todo-backend:active
                    docker tag todo-frontend:${BUILD_TAG_ID} todo-frontend:active
                '''
            }
        }

        stage('Deploy') {
            steps {
                sh 'docker-compose -f docker-compose.prod.yaml up -d'
            }
        }
    }

    post {
        failure {
            echo "🧯 PIPELINE FAILED – START ROLLBACK"

            stage('Rollback to Stable') {
                agent any
                steps {
                    sh '''
                        docker image inspect todo-backend:stable >/dev/null 2>&1 || {
                            echo "❌ No stable image – rollback impossible"
                            exit 1
                        }

                        docker tag todo-backend:stable todo-backend:active
                        docker tag todo-frontend:stable todo-frontend:active

                        docker-compose -f docker-compose.prod.yaml up -d
                    '''
                }
            }
        }

        success {
            echo "✅ DEPLOY SUCCESS – ${BUILD_TAG_ID}"
        }
    }
}
