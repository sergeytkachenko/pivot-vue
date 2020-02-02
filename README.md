## 

### DOCKER 

#### Build 

```bash
docker build -f install/Dockerfile -t pivot-vue .
```

#### Run 

```bash
docker run -d --name pivot-vue --rm -p 8080:80 pivot-vue
```
