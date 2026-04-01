pipeline {
  agent any

  environment {
    AWS_REGION = 'ap-southeast-1'
    AWS_ACCOUNT_ID = '153860374757'
    EKS_CLUSTER = 'student-timetable-prod'
    ECR_BACKEND = 'student-timetable-backend'
    ECR_FRONTEND = 'student-timetable-frontend'
    BACKEND_IMAGE = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_BACKEND}"
    FRONTEND_IMAGE = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_FRONTEND}"
    IMAGE_TAG = "${env.BUILD_NUMBER}"
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Verify Tools') {
      steps {
        sh '''
          aws --version
          docker version
          kubectl version --client
          helm version
        '''
      }
    }

    stage('Login ECR') {
      steps {
        sh '''
          aws ecr get-login-password --region ${AWS_REGION} | \
          docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com
        '''
      }
    }

    stage('Build Images') {
      steps {
        sh '''
          docker build -t ${BACKEND_IMAGE}:${IMAGE_TAG} ./backend
          docker build -t ${FRONTEND_IMAGE}:${IMAGE_TAG} ./frontend
        '''
      }
    }

    stage('Push Images') {
      steps {
        sh '''
          docker push ${BACKEND_IMAGE}:${IMAGE_TAG}
          docker push ${FRONTEND_IMAGE}:${IMAGE_TAG}
        '''
      }
    }

    stage('Deploy to EKS') {
      steps {
        sh '''
          aws eks update-kubeconfig --region ${AWS_REGION} --name ${EKS_CLUSTER}

          kubectl -n app set image deployment/backend backend=${BACKEND_IMAGE}:${IMAGE_TAG}
          kubectl -n app set image deployment/frontend frontend=${FRONTEND_IMAGE}:${IMAGE_TAG}

          kubectl -n app rollout status deployment/backend --timeout=300s
          kubectl -n app rollout status deployment/frontend --timeout=300s
        '''
      }
    }
  }

  post {
    always {
      sh 'docker image prune -af || true'
    }
  }
}