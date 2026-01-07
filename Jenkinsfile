pipeline {
  agent any

  environment {
    COMPOSE_FILE = "/deploy/docker-compose.prod.yaml"
    PROJECT_NAME = "todo-prod"
  }

  stages {

    stage("Validate Environment") {
      steps {
        sh '''
          echo "🔍 Validate environment"
          command -v docker >/dev/null || { echo "❌ Docker not found"; exit 1; }
          command -v docker compose >/dev/null || { echo "❌ Docker Compose not found"; exit 1; }
          test -f $COMPOSE_FILE || { echo "❌ docker-compose.prod.yaml missing"; exit 1; }
        '''
      }
    }

    stage("Docker Login") {
      steps {
        withCredentials([usernamePassword(
          credentialsId: 'dockerhub',
          usernameVariable: 'DOCKER_USER',
          passwordVariable: 'DOCKER_PASS'
        )]) {
          sh '''
            echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin
          '''
        }
      }
    }

    stage("Pull Images") {
      steps {
        sh '''
          echo "📥 Pull latest images"
          docker compose -f $COMPOSE_FILE pull
        '''
      }
    }

    stage("Deploy Production") {
      steps {
        sh '''
          echo "🚀 Deploying production"
          docker compose -f $COMPOSE_FILE up -d --remove-orphans
        '''
      }
    }
  }

  post {
    success {
      echo "✅ DEPLOY SUCCESS"
    }
    failure {
      echo "❌ DEPLOY FAILED"
    }
  }
}
