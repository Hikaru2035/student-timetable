pipeline {
    agent any

    environment {
        DEPLOY_DIR   = "/home/dev/todo-api"
        BUILD_TAG_ID = "build-${BUILD_NUMBER}"
    }

    stages {

        stage('Prepare Workspace') {
            steps {
                sh '''
                    set -e
                    cd $DEPLOY_DIR
                '''
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
                    npm run build

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

                    echo "Build backend image"
                    docker build -t todo-backend:${BUILD_TAG_ID} backend

                    echo "Build frontend image"
                    docker build -t todo-frontend:${BUILD_TAG_ID} frontend
                '''
            }
        }

        stage('Backup Current Active → Stable') {
            steps {
                sh '''
                    set -e
                    echo "Backup active images → stable"

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
                    set -e
                    echo "Promote build → active"

                    docker tag todo-backend:${BUILD_TAG_ID} todo-backend:active
                    docker tag todo-frontend:${BUILD_TAG_ID} todo-frontend:active
                '''
            }
        }

        stage('Deploy') {
            steps {
                sh '''
                    set -e
                    cd $DEPLOY_DIR

                    echo "Deploy active images"
                    docker-compose -f docker-compose.prod.yaml up -d
                '''
            }
        }
    }

    post {

        failure {
            echo "PIPELINE FAILED – CLEANUP FAILED BUILD IMAGES"

            sh '''
                docker image inspect todo-backend:${BUILD_TAG_ID} >/dev/null 2>&1 \
                && docker rmi -f todo-backend:${BUILD_TAG_ID} || true

                docker image inspect todo-frontend:${BUILD_TAG_ID} >/dev/null 2>&1 \
                && docker rmi -f todo-frontend:${BUILD_TAG_ID} || true
            '''

            echo "ROLLBACK TO STABLE"

            sh '''
                set -e
                cd $DEPLOY_DIR

                docker image inspect todo-backend:stable >/dev/null 2>&1 || {
                    echo "No stable backend image – rollback impossible"
                    exit 1
                }

                docker tag todo-backend:stable todo-backend:active
                docker tag todo-frontend:stable todo-frontend:active

                docker-compose -f docker-compose.prod.yaml up -d
            '''
        }

        success {
            echo "DEPLOY SUCCESS – ${BUILD_TAG_ID}"
            echo "Cleaning old images"

            
            sh '''
            docker images todo-backend --format '{{.Tag}}' \
            | grep '^build-' \
            | sort -V \
            | head -n -5 \
            | awk '{print "todo-backend:"$1}' \
            | xargs -r docker rmi || true

            docker images todo-frontend --format '{{.Tag}}' \
            | grep '^build-' \
            | sort -V \
            | head -n -5 \
            | awk '{print "todo-frontend:"$1}' \
            | xargs -r docker rmi || true
        '''
        }
    }
}
