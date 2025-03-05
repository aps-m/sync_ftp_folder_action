# sync_ftp_folder_action

Синхронизация локальной и удаленной папки на FTP сервере

## Параметры

| Параметр | Описание                        | Тип    | Обязательный | Значение по умолчанию |
| -------- | ------------------------------- | ------ | ------------ | --------------------- |
| host     | Адрес/IP                        | Строка | Да           | localhost             |
| port     | Порт сервера                    | Число  | Да           | 21                    |
| password | Пароль                          | Строка | Да           | -                     |
| timeout  | Таймаут ожидания в мс           | Число  | Да           | 10000                 |
| src_path | Путь локальной папки источника  | Строка | Да           | -                     |
| dst_path | Путь удаленной папки назначения | Строка | Да           | .                     |

## Пример использования

```yml
- name: Sync folder with test files
  uses: aps-m/sync_ftp_folder_action@main
  with:
    host: localhost
    timeout: 60000
    src_path: '/path/to/src_example'
    dst_path: '/path/to/dst_example'
```
