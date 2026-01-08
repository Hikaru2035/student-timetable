pipeline {
    agent any

    environment {
        BUILD_TAG_ID = "build-${BUILD_NUMBER}"
        DEPLOY_DIR   = "${WORKSPACE}"
    }

    options {
        timestamps()
        disableConcurrentBuilds()
    }

    stages {

        stage('Checkout Source') {
            steps {
                checkout scm
            }
        }

        stage('Install & Build App') {
            steps {
                sh '''
                    set -e
                    cd $DEPLOY_DIR

                    echo "Backend install"
                    cd backend
                    npm ci

                    echo "Frontend build"
                    cd ../frontend
                    npm ci
                    npm run build
                '''
            }
        }

        stage('Build Docker Images') {
            steps {
                sh '''
                    set -e
                    cd $DEPLOY_DIR

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
                sh '''
                    docker-compose -f docker-compose.prod.yaml up -d
                '''
            }
        }
    }

    post {
        failure {
            echo "DEPLOY FAILED – ROLLBACK"

            sh '''
                docker image inspect todo-backend:stable >/dev/null 2>&1 || exit 1

                docker tag todo-backend:stable todo-backend:active
                docker tag todo-frontend:stable todo-frontend:active

                docker-compose -f docker-compose.prod.yaml up -d
            '''
        }

        success {
            echo "DEPLOY SUCCESS – ${BUILD_TAG_ID}"

            sh '''
                docker images todo-backend --format '{{.Tag}}' \
                | grep '^build-' | sort -V | head -n -5 \
                | awk '{print "todo-backend:"$1}' \
                | xargs -r docker rmi || true

                docker images todo-frontend --format '{{.Tag}}' \
                | grep '^build-' | sort -V | head -n -5 \
                | awk '{print "todo-frontend:"$1}' \
                | xargs -r docker rmi || true
            '''
        }
    }
}
