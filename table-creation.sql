
DROP TABLE IF EXISTS parent;
DROP TABLE IF EXISTS child;
DROP TYPE IF EXISTS chore_status;
DROP TABLE IF EXISTS assigned_chore;
DROP TABLE IF EXISTS chore_template;

CREATE TABLE parent(
id serial primary key,
username text not null,
name text not null,
email text not null,
password varchar not null);

CREATE TABLE child(
id serial primary key,
username text not null,
name text not null,
password varchar not null, 
piggybank numeric default 0,
p_id integer references parent(id));

CREATE TYPE chore_status AS ENUM ('assigned', 'completed', 'approved');

CREATE TABLE assigned_chore (
id serial primary key,
owner integer references child(id),
name text not null,
description text not null,
value numeric not null,
status chore_status);

CREATE TABLE chore_template (
id serial primary key,
owner integer references parent(id),
name text not null,
description text not null,
value numeric not null);





