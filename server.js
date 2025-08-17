const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); // Serve files from root directory

// Database connection
const db = new sqlite3.Database('./db/database.sqlite', (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
    }
});

// ========== PERSONNEL CRUD API ==========

// GET all personnel with filters
app.get('/api/personnel', (req, res) => {
    const { search, department_id, population_id, qualificationId, departmentId, populationId } = req.query;
    
    // Support both parameter names for flexibility
    const deptId = department_id || departmentId;
    const popId = population_id || populationId;
    const qualId = qualificationId;
    
    let query = `
        SELECT DISTINCT p.*, 
               pop.name as population_name,
               d.name as department_name
        FROM personnel p
        LEFT JOIN populations pop ON p.population_id = pop.id
        LEFT JOIN departments d ON p.department_id = d.id
    `;
    
    // Add JOIN for qualification filtering
    if (qualId) {
        query += ` INNER JOIN person_skills ps ON p.id = ps.person_id`;
    }
    
    query += ` WHERE 1=1`;
    
    const params = [];
    
    if (search) {
        query += ` AND (p.full_name LIKE ? OR p.personal_number LIKE ?)`;
        params.push(`%${search}%`, `%${search}%`);
    }
    
    if (deptId) {
        query += ` AND p.department_id = ?`;
        params.push(deptId);
    }
    
    if (popId) {
        query += ` AND p.population_id = ?`;
        params.push(popId);
    }
    
    if (qualId) {
        query += ` AND ps.skill_id = ? AND ps.status = 'מוסמך כשיר'`;
        params.push(qualId);
    }
    
    query += ` ORDER BY p.full_name`;
    
    db.all(query, params, (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json(rows);
        }
    });
});

// GET single personnel
app.get('/api/personnel/:id', (req, res) => {
    const query = `
        SELECT p.*, 
               pop.name as population_name,
               d.name as department_name
        FROM personnel p
        LEFT JOIN populations pop ON p.population_id = pop.id
        LEFT JOIN departments d ON p.department_id = d.id
        WHERE p.id = ?
    `;
    
    db.get(query, [req.params.id], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else if (!row) {
            res.status(404).json({ error: 'Personnel not found' });
        } else {
            res.json(row);
        }
    });
});

// POST create personnel
app.post('/api/personnel', (req, res) => {
    const {
        full_name, personal_number, rank, branch, residence, phone,
        population_id, department_id, is_commander, id_number,
        birth_date, enlistment_date, discharge_date, arrival_date,
        marital_status, course_cycle, notes
    } = req.body;
    
    // Validation
    if (!full_name || !personal_number || !rank || !branch || !residence || 
        !phone || !id_number || !birth_date || !enlistment_date || 
        !discharge_date || !marital_status || !course_cycle) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Check for unique personal_number
    db.get('SELECT id FROM personnel WHERE personal_number = ?', [personal_number], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (row) {
            return res.status(400).json({ error: 'Personal number already exists' });
        }
        
        const query = `
            INSERT INTO personnel (
                full_name, personal_number, rank, branch, residence, phone,
                population_id, department_id, is_commander, id_number,
                birth_date, enlistment_date, discharge_date, arrival_date,
                marital_status, course_cycle, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        db.run(query, [
            full_name, personal_number, rank, branch, residence, phone,
            population_id || null, department_id || null, 0, id_number, // is_commander always 0, optional fields as null
            birth_date, enlistment_date, discharge_date, arrival_date,
            marital_status, course_cycle, notes
        ], function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
            } else {
                res.json({ id: this.lastID, message: 'Personnel created successfully' });
            }
        });
    });
});

// PUT update personnel
app.put('/api/personnel/:id', (req, res) => {
    const {
        full_name, personal_number, rank, branch, residence, phone,
        population_id, department_id, is_commander, id_number,
        birth_date, enlistment_date, discharge_date, arrival_date,
        marital_status, course_cycle, notes
    } = req.body;
    
    const query = `
        UPDATE personnel SET
            full_name = ?, personal_number = ?, rank = ?, branch = ?, 
            residence = ?, phone = ?, population_id = ?, department_id = ?,
            is_commander = ?, id_number = ?, birth_date = ?, 
            enlistment_date = ?, discharge_date = ?, arrival_date = ?,
            marital_status = ?, course_cycle = ?, notes = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `;
    
    db.run(query, [
        full_name, personal_number, rank, branch, residence, phone,
        population_id || null, department_id || null, 0, id_number, // is_commander always 0, optional fields as null
        birth_date, enlistment_date, discharge_date, arrival_date,
        marital_status, course_cycle, notes, req.params.id
    ], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
        } else if (this.changes === 0) {
            res.status(404).json({ error: 'Personnel not found' });
        } else {
            res.json({ message: 'Personnel updated successfully' });
        }
    });
});

// DELETE personnel
app.delete('/api/personnel/:id', (req, res) => {
    db.run('DELETE FROM personnel WHERE id = ?', [req.params.id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
        } else if (this.changes === 0) {
            res.status(404).json({ error: 'Personnel not found' });
        } else {
            res.json({ message: 'Personnel deleted successfully' });
        }
    });
});

// ========== PERSONNEL BATCH OPERATIONS ==========

// POST batch add personnel to population
app.post('/api/personnel/batch/population', (req, res) => {
    const { ids, populationId } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0 || !populationId) {
        return res.status(400).json({ error: 'Missing required fields: ids (array) and populationId' });
    }
    
    const results = [];
    let completedOperations = 0;
    
    ids.forEach(id => {
        db.run(
            'UPDATE personnel SET population_id = ? WHERE id = ?',
            [populationId, id],
            function(err) {
                completedOperations++;
                
                if (err) {
                    results.push({ id, success: false, error: err.message });
                } else if (this.changes === 0) {
                    results.push({ id, success: false, error: 'Personnel not found' });
                } else {
                    results.push({ id, success: true });
                }
                
                // Send response when all operations complete
                if (completedOperations === ids.length) {
                    res.json({ 
                        message: 'Batch operation completed',
                        results,
                        successCount: results.filter(r => r.success).length,
                        errorCount: results.filter(r => !r.success).length
                    });
                }
            }
        );
    });
});

// POST batch add personnel to department
app.post('/api/personnel/batch/department', (req, res) => {
    const { ids, departmentId } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0 || !departmentId) {
        return res.status(400).json({ error: 'Missing required fields: ids (array) and departmentId' });
    }
    
    const results = [];
    let completedOperations = 0;
    
    ids.forEach(id => {
        db.run(
            'UPDATE personnel SET department_id = ? WHERE id = ?',
            [departmentId, id],
            function(err) {
                completedOperations++;
                
                if (err) {
                    results.push({ id, success: false, error: err.message });
                } else if (this.changes === 0) {
                    results.push({ id, success: false, error: 'Personnel not found' });
                } else {
                    results.push({ id, success: true });
                }
                
                // Send response when all operations complete
                if (completedOperations === ids.length) {
                    res.json({ 
                        message: 'Batch operation completed',
                        results,
                        successCount: results.filter(r => r.success).length,
                        errorCount: results.filter(r => !r.success).length
                    });
                }
            }
        );
    });
});

// ========== DEPARTMENTS CRUD API ==========

// GET all departments
app.get('/api/departments', (req, res) => {
    const query = `
        SELECT d.*, 
               p.full_name as commander_name,
               COUNT(personnel.id) as member_count
        FROM departments d
        LEFT JOIN personnel p ON d.commander_id = p.id
        LEFT JOIN personnel ON d.id = personnel.department_id
        GROUP BY d.id, p.full_name
        ORDER BY d.name
    `;
    
    db.all(query, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json(rows);
        }
    });
});

// POST create department
app.post('/api/departments', (req, res) => {
    const { name, commander_id, soldier_ids, soldierIds } = req.body;
    const soldierIdsList = soldier_ids || soldierIds;
    
    if (!name) {
        return res.status(400).json({ error: 'Department name is required' });
    }
    
    if (!commander_id) {
        return res.status(400).json({ error: 'Department commander is required' });
    }
    
    // soldierIds can be empty if we only have a commander
    
    // Check for unique name (case insensitive)
    db.get('SELECT id FROM departments WHERE LOWER(name) = LOWER(?)', [name], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (row) {
            return res.status(400).json({ error: 'Department name already exists' });
        }
        
        // Start transaction - automatically transfer personnel from other departments
        db.serialize(() => {
            db.run('BEGIN TRANSACTION');
            
            // Create department
            const query = 'INSERT INTO departments (name, commander_id, notes) VALUES (?, ?, ?)';
            
            db.run(query, [name, commander_id, ''], function(err) {
                if (err) {
                    db.run('ROLLBACK');
                    return res.status(500).json({ error: err.message });
                }
                
                const departmentId = this.lastID;
                
                // Assign personnel to department
                const updatePromises = [];
                
                // Assign commander if provided
                if (commander_id) {
                    updatePromises.push(
                        new Promise((resolve, reject) => {
                            db.run('UPDATE personnel SET department_id = ?, is_commander = 1 WHERE id = ?', 
                                [departmentId, commander_id], (err) => {
                                if (err) reject(err);
                                else resolve();
                            });
                        })
                    );
                }
                
                // Assign soldiers if provided
                if (soldierIdsList && soldierIdsList.length > 0) {
                    soldierIdsList.filter(s => s !== commander_id).forEach(soldierID => {
                        updatePromises.push(
                            new Promise((resolve, reject) => {
                                db.run('UPDATE personnel SET department_id = ?, is_commander = 0 WHERE id = ?', 
                                    [departmentId, soldierID], (err) => {
                                    if (err) reject(err);
                                    else resolve();
                                });
                            })
                        );
                    });
                }
                
                // Execute all personnel updates
                if (updatePromises.length > 0) {
                    Promise.all(updatePromises)
                        .then(() => {
                            db.run('COMMIT');
                            res.json({ id: departmentId, message: 'Department created successfully' });
                        })
                        .catch(err => {
                            db.run('ROLLBACK');
                            res.status(500).json({ error: err.message });
                        });
                } else {
                    db.run('COMMIT');
                    res.json({ id: departmentId, message: 'Department created successfully' });
                }
            });
        });
    });
});

// GET single department
app.get('/api/departments/:id', (req, res) => {
    const departmentId = req.params.id;
    
    // Get department basic info
    const departmentQuery = `
        SELECT d.*, 
               p.full_name as commander_name
        FROM departments d
        LEFT JOIN personnel p ON d.commander_id = p.id
        WHERE d.id = ?
    `;
    
    db.get(departmentQuery, [departmentId], (err, department) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        } else if (!department) {
            return res.status(404).json({ error: 'Department not found' });
        }
        
        // Get all personnel in this department
        const membersQuery = `
            SELECT id, full_name, rank, personal_number, is_commander
            FROM personnel 
            WHERE department_id = ?
            ORDER BY is_commander DESC, full_name
        `;
        
        db.all(membersQuery, [departmentId], (err, members) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            
            // Separate commander and soldiers
            const commander = members.find(m => m.is_commander === 1);
            const soldiers = members.filter(m => m.id !== department.commander_id); // Exclude commander from soldiers list
            
            res.json({
                ...department,
                member_count: members.length,
                members: members,
                soldiers: soldiers,
                commander_info: commander
            });
        });
    });
});

// PUT update department
app.put('/api/departments/:id', (req, res) => {
    const { name, commander_id, soldier_ids, soldierIds, commanderId, force } = req.body;
    const soldierIdsList = soldier_ids || soldierIds;
    const actualCommanderId = commander_id || commanderId;
    
    if (!name) {
        return res.status(400).json({ error: 'Department name is required' });
    }
    
    if (!actualCommanderId) {
        return res.status(400).json({ error: 'Department commander is required' });
    }
    
    // soldierIds can be empty if we only have a commander
    
    // Check for unique name (excluding current record)
    db.get('SELECT id FROM departments WHERE LOWER(name) = LOWER(?) AND id != ?', [name, req.params.id], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (row) {
            return res.status(400).json({ error: 'Department name already exists' });
        }
        
        // Proceed with update - automatically transfer personnel from other departments
        
        // Start transaction
        db.serialize(() => {
            db.run('BEGIN TRANSACTION');
            
            // Update department
            const query = `
                UPDATE departments SET
                    name = ?, commander_id = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `;
            
            db.run(query, [name, actualCommanderId, '', req.params.id], function(err) {
                if (err) {
                    db.run('ROLLBACK');
                    return res.status(500).json({ error: err.message });
                }
                
                if (this.changes === 0) {
                    db.run('ROLLBACK');
                    return res.status(404).json({ error: 'Department not found' });
                }
                
                // First, remove all current personnel from this department
                db.run('UPDATE personnel SET department_id = NULL WHERE department_id = ?', [req.params.id], (err) => {
                    if (err) {
                        db.run('ROLLBACK');
                        return res.status(500).json({ error: err.message });
                    }
                    
                    // Assign commander and soldiers to department
                    const allPersonnel = actualCommanderId ? [actualCommanderId] : [];
                    if (soldierIdsList && soldierIdsList.length > 0) {
                        allPersonnel.push(...soldierIdsList.filter(s => s !== actualCommanderId));
                    }
                    
                    if (allPersonnel.length > 0) {
                        const updatePromises = allPersonnel.map(personId => 
                            new Promise((resolve, reject) => {
                                db.run('UPDATE personnel SET department_id = ? WHERE id = ?', [req.params.id, personId], (err) => {
                                    if (err) reject(err);
                                    else resolve();
                                });
                            })
                        );
                        
                        Promise.all(updatePromises)
                            .then(() => {
                                db.run('COMMIT');
                                res.json({ message: 'Department updated successfully' });
                            })
                            .catch(err => {
                                db.run('ROLLBACK');
                                res.status(500).json({ error: err.message });
                            });
                    } else {
                        db.run('COMMIT');
                        res.json({ message: 'Department updated successfully' });
                    }
                });
            });
        });
    });
});

// GET available personnel for department assignment
app.get('/api/departments/:id/available-personnel', (req, res) => {
    const query = `
        SELECT id, full_name, rank, personal_number,
               CASE WHEN department_id = ? THEN 1 ELSE 0 END as is_current_member
        FROM personnel
        ORDER BY full_name
    `;
    
    db.all(query, [req.params.id], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json(rows);
        }
    });
});

// GET current department members
app.get('/api/departments/:id/members', (req, res) => {
    const query = `
        SELECT id, full_name, rank, personal_number,
               CASE WHEN id = (SELECT commander_id FROM departments WHERE id = ?) THEN 1 ELSE 0 END as is_commander
        FROM personnel
        WHERE department_id = ?
        ORDER BY full_name
    `;
    
    db.all(query, [req.params.id, req.params.id], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json(rows);
        }
    });
});

// DELETE department - unassign personnel and delete
app.delete('/api/departments/:id', (req, res) => {
    // Start transaction to unassign personnel and delete department
    db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        
        // First, unassign all personnel from this department
        db.run('UPDATE personnel SET department_id = NULL WHERE department_id = ?', [req.params.id], function(err) {
            if (err) {
                db.run('ROLLBACK');
                return res.status(500).json({ error: err.message });
            }
            
            // Then delete the department
            db.run('DELETE FROM departments WHERE id = ?', [req.params.id], function(err) {
                if (err) {
                    db.run('ROLLBACK');
                    return res.status(500).json({ error: err.message });
                } else if (this.changes === 0) {
                    db.run('ROLLBACK');
                    return res.status(404).json({ error: 'Department not found' });
                } else {
                    db.run('COMMIT');
                    res.json({ message: 'Department deleted successfully' });
                }
            });
        });
    });
});

// ========== POSITIONS CRUD API ==========

// GET all positions
app.get('/api/positions', (req, res) => {
    const query = `
        SELECT p.*, 
               COUNT(r.id) as role_count
        FROM positions p
        LEFT JOIN roles r ON p.id = r.position_id
        GROUP BY p.id
        ORDER BY p.name
    `;
    
    db.all(query, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json(rows);
        }
    });
});

// POST create position
// OLD POST create position - REMOVED (duplicate) - see new version below
app.post('/api/positions_OLD_REMOVED', (req, res) => {
    const { name, notes, roles } = req.body;
    
    if (!name) {
        return res.status(400).json({ error: 'Position name is required' });
    }
    
    if (!roles || roles.length === 0) {
        return res.status(400).json({ error: 'At least one role-holder is required' });
    }
    
    // Check for unique name (case insensitive)
    db.get('SELECT id FROM positions WHERE LOWER(name) = LOWER(?)', [name], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (row) {
            return res.status(400).json({ error: 'Position name already exists' });
        }
        
        // Start transaction
        db.serialize(() => {
            db.run('BEGIN TRANSACTION');
            
            // Create position
            const query = 'INSERT INTO positions (name, notes) VALUES (?, ?)';
            
            db.run(query, [name, notes], function(err) {
                if (err) {
                    db.run('ROLLBACK');
                    return res.status(500).json({ error: err.message });
                }
                
                const positionId = this.lastID;
                
                // Create roles
                const rolePromises = roles.map(role => 
                    new Promise((resolve, reject) => {
                        // Insert role
                        db.run('INSERT INTO roles (position_id, name, notes) VALUES (?, ?, ?)', 
                            [positionId, role.name, role.notes || ''], function(err) {
                            if (err) {
                                reject(err);
                                return;
                            }
                            
                            const roleId = this.lastID;
                            
                            // Insert role skills
                            if (role.required_skills && role.required_skills.length > 0) {
                                const skillPromises = role.required_skills.map(skill =>
                                    new Promise((skillResolve, skillReject) => {
                                        db.run('INSERT INTO role_skills (role_id, skill_id, is_mandatory) VALUES (?, ?, ?)',
                                            [roleId, skill.skill_id, skill.is_mandatory ? 1 : 0], (err) => {
                                            if (err) skillReject(err);
                                            else skillResolve();
                                        });
                                    })
                                );
                                
                                Promise.all(skillPromises).then(resolve).catch(reject);
                            } else {
                                resolve();
                            }
                        });
                    })
                );
                
                Promise.all(rolePromises)
                    .then(() => {
                        db.run('COMMIT');
                        res.json({ id: positionId, message: 'Position created successfully' });
                    })
                    .catch(err => {
                        db.run('ROLLBACK');
                        res.status(500).json({ error: err.message });
                    });
            });
        });
    });
});


// ========== PERSONNEL CRUD API ==========

// GET all personnel
app.get('/api/personnel', (req, res) => {
    const query = `
        SELECT p.*, 
               pop.name as population_name,
               d.name as department_name
        FROM personnel p
        LEFT JOIN populations pop ON p.population_id = pop.id
        LEFT JOIN departments d ON p.department_id = d.id
        ORDER BY p.full_name
    `;
    
    db.all(query, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json(rows);
        }
    });
});

// POST create personnel
app.post('/api/personnel', (req, res) => {
    const {
        full_name, personal_number, rank, branch, residence, phone,
        population_id, department_id, id_number, birth_date,
        enlistment_date, discharge_date, arrival_date, marital_status,
        course_cycle, notes
    } = req.body;
    
    // Required field validation
    if (!full_name || !personal_number || !rank || !branch || !residence || !phone || 
        !id_number || !birth_date || !enlistment_date || !discharge_date || 
        !marital_status || !course_cycle) {
        return res.status(400).json({ error: 'All required fields must be provided' });
    }
    
    // Check for unique personal_number
    db.get('SELECT id FROM personnel WHERE personal_number = ?', [personal_number], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (row) {
            return res.status(400).json({ error: 'Personal number already exists' });
        }
        
        const query = `
            INSERT INTO personnel (
                full_name, personal_number, rank, branch, residence, phone,
                population_id, department_id, is_commander, id_number, birth_date,
                enlistment_date, discharge_date, arrival_date, marital_status,
                course_cycle, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        db.run(query, [
            full_name, personal_number, rank, branch, residence, phone,
            population_id || null, department_id || null, id_number, birth_date,
            enlistment_date, discharge_date, arrival_date || null, marital_status,
            course_cycle, notes || null
        ], function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
            } else {
                res.json({ id: this.lastID, message: 'Personnel created successfully' });
            }
        });
    });
});

// ========== SKILLS/QUALIFICATIONS CRUD API ==========

// GET all skills
app.get('/api/skills', (req, res) => {
    const query = `
        SELECT s.*, 
               COUNT(ps.id) as qualified_count
        FROM skills s
        LEFT JOIN person_skills ps ON s.id = ps.skill_id AND ps.status = 'מוסמך כשיר'
        GROUP BY s.id
        ORDER BY s.name
    `;
    
    db.all(query, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json(rows);
        }
    });
});

// ========== POPULATIONS CRUD API ==========

// GET all populations
app.get('/api/populations', (req, res) => {
    const query = `
        SELECT p.*, 
               COUNT(personnel.id) as person_count
        FROM populations p
        LEFT JOIN personnel ON p.id = personnel.population_id
        GROUP BY p.id
        ORDER BY p.name
    `;
    
    db.all(query, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json(rows);
        }
    });
});

// GET single population
app.get('/api/populations/:id', (req, res) => {
    const query = `
        SELECT p.*, 
               COUNT(personnel.id) as person_count
        FROM populations p
        LEFT JOIN personnel ON p.id = personnel.population_id
        WHERE p.id = ?
        GROUP BY p.id
    `;
    
    db.get(query, [req.params.id], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else if (!row) {
            res.status(404).json({ error: 'Population not found' });
        } else {
            res.json(row);
        }
    });
});

// POST create population
app.post('/api/populations', (req, res) => {
    const { name, notes } = req.body;
    
    if (!name) {
        return res.status(400).json({ error: 'Population name is required' });
    }
    
    // Check for unique name (case insensitive)
    db.get('SELECT id FROM populations WHERE LOWER(name) = LOWER(?)', [name], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (row) {
            return res.status(400).json({ error: 'Population name already exists' });
        }
        
        const query = 'INSERT INTO populations (name, notes) VALUES (?, ?)';
        
        db.run(query, [name, notes], function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
            } else {
                res.json({ id: this.lastID, message: 'Population created successfully' });
            }
        });
    });
});

// PUT update population
app.put('/api/populations/:id', (req, res) => {
    const { name, notes } = req.body;
    
    if (!name) {
        return res.status(400).json({ error: 'Population name is required' });
    }
    
    // Check for unique name (excluding current record)
    db.get('SELECT id FROM populations WHERE LOWER(name) = LOWER(?) AND id != ?', [name, req.params.id], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (row) {
            return res.status(400).json({ error: 'Population name already exists' });
        }
        
        const query = `
            UPDATE populations SET
                name = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `;
        
        db.run(query, [name, notes, req.params.id], function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
            } else if (this.changes === 0) {
                res.status(404).json({ error: 'Population not found' });
            } else {
                res.json({ message: 'Population updated successfully' });
            }
        });
    });
});

// DELETE population
app.delete('/api/populations/:id', (req, res) => {
    // First check if any personnel are assigned to this population
    db.get('SELECT COUNT(*) as count FROM personnel WHERE population_id = ?', [req.params.id], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        
        if (row.count > 0) {
            return res.status(400).json({ 
                error: 'Cannot delete population - there are people assigned to it',
                assigned_count: row.count 
            });
        }
        
        // Safe to delete
        db.run('DELETE FROM populations WHERE id = ?', [req.params.id], function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
            } else if (this.changes === 0) {
                res.status(404).json({ error: 'Population not found' });
            } else {
                res.json({ message: 'Population deleted successfully' });
            }
        });
    });
});

// ========== SKILLS CRUD API ==========

// GET all skills
app.get('/api/skills', (req, res) => {
    const query = `
        SELECT s.*, 
               COUNT(ps.skill_id) as person_count
        FROM skills s
        LEFT JOIN person_skills ps ON s.id = ps.skill_id AND ps.status = 'מוסמך כשיר'
        GROUP BY s.id
        ORDER BY s.name
    `;
    
    db.all(query, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json(rows);
        }
    });
});

// GET single skill
app.get('/api/skills/:id', (req, res) => {
    const query = `
        SELECT s.*, 
               COUNT(ps.skill_id) as person_count
        FROM skills s
        LEFT JOIN person_skills ps ON s.id = ps.skill_id AND ps.status = 'מוסמך כשיר'
        WHERE s.id = ?
        GROUP BY s.id
    `;
    
    db.get(query, [req.params.id], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else if (!row) {
            res.status(404).json({ error: 'Skill not found' });
        } else {
            res.json(row);
        }
    });
});

// POST create skill
app.post('/api/skills', (req, res) => {
    const { name, notes } = req.body;
    
    if (!name) {
        return res.status(400).json({ error: 'Skill name is required' });
    }
    
    // Check for unique name (case insensitive)
    db.get('SELECT id FROM skills WHERE LOWER(name) = LOWER(?)', [name], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (row) {
            return res.status(400).json({ error: 'Skill name already exists' });
        }
        
        const query = 'INSERT INTO skills (name, notes) VALUES (?, ?)';
        
        db.run(query, [name, notes], function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
            } else {
                res.json({ id: this.lastID, message: 'Skill created successfully' });
            }
        });
    });
});

// PUT update skill
app.put('/api/skills/:id', (req, res) => {
    const { name, notes } = req.body;
    
    if (!name) {
        return res.status(400).json({ error: 'Skill name is required' });
    }
    
    // Check for unique name (excluding current record)
    db.get('SELECT id FROM skills WHERE LOWER(name) = LOWER(?) AND id != ?', [name, req.params.id], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (row) {
            return res.status(400).json({ error: 'Skill name already exists' });
        }
        
        const query = `
            UPDATE skills SET
                name = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `;
        
        db.run(query, [name, notes, req.params.id], function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
            } else if (this.changes === 0) {
                res.status(404).json({ error: 'Skill not found' });
            } else {
                res.json({ message: 'Skill updated successfully' });
            }
        });
    });
});

// DELETE skill
app.delete('/api/skills/:id', (req, res) => {
    // First check if any person skills are assigned to this skill
    db.get('SELECT COUNT(*) as count FROM person_skills WHERE skill_id = ?', [req.params.id], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        
        if (row.count > 0) {
            return res.status(400).json({ 
                error: 'Cannot delete skill - there are people with this skill',
                assigned_count: row.count 
            });
        }
        
        // Safe to delete
        db.run('DELETE FROM skills WHERE id = ?', [req.params.id], function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
            } else if (this.changes === 0) {
                res.status(404).json({ error: 'Skill not found' });
            } else {
                res.json({ message: 'Skill deleted successfully' });
            }
        });
    });
});

// ========== PERSON SKILLS CRUD API ==========

// GET person skills for a specific person
app.get('/api/personnel/:id/skills', (req, res) => {
    const query = `
        SELECT ps.*, s.name as skill_name, s.notes as skill_notes
        FROM person_skills ps
        JOIN skills s ON ps.skill_id = s.id
        WHERE ps.person_id = ?
        ORDER BY s.name
    `;
    
    db.all(query, [req.params.id], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json(rows);
        }
    });
});

// POST assign skill to person
app.post('/api/personnel/:id/skills', (req, res) => {
    const { skill_id, status, training_start_date, training_end_date, expiry_date, notes } = req.body;
    const person_id = req.params.id;
    
    if (!skill_id || !status) {
        return res.status(400).json({ error: 'Skill ID and status are required' });
    }
    
    // Validate status
    const validStatuses = ['מוסמך כשיר', 'בתהליך הסמכה', 'נכשל', 'פג תוקף'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }
    
    // Check if person-skill combination already exists
    db.get('SELECT id FROM person_skills WHERE person_id = ? AND skill_id = ?', [person_id, skill_id], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (row) {
            return res.status(400).json({ error: 'Person already has this skill assigned' });
        }
        
        const query = `
            INSERT INTO person_skills (person_id, skill_id, status, training_start_date, training_end_date, expiry_date, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        
        db.run(query, [person_id, skill_id, status, training_start_date, training_end_date, expiry_date, notes], function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
            } else {
                res.json({ id: this.lastID, message: 'Skill assigned successfully' });
            }
        });
    });
});

// PUT update person skill
app.put('/api/personnel/:id/skills/:skill_id', (req, res) => {
    const { status, training_start_date, training_end_date, expiry_date, notes } = req.body;
    const person_id = req.params.id;
    const skill_id = req.params.skill_id;
    
    if (!status) {
        return res.status(400).json({ error: 'Status is required' });
    }
    
    // Validate status
    const validStatuses = ['מוסמך כשיר', 'בתהליך הסמכה', 'נכשל', 'פג תוקף'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }
    
    const query = `
        UPDATE person_skills SET
            status = ?, training_start_date = ?, training_end_date = ?, 
            expiry_date = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
        WHERE person_id = ? AND skill_id = ?
    `;
    
    db.run(query, [status, training_start_date, training_end_date, expiry_date, notes, person_id, skill_id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
        } else if (this.changes === 0) {
            res.status(404).json({ error: 'Person skill assignment not found' });
        } else {
            res.json({ message: 'Skill assignment updated successfully' });
        }
    });
});

// DELETE remove skill from person
app.delete('/api/personnel/:id/skills/:skill_id', (req, res) => {
    const person_id = req.params.id;
    const skill_id = req.params.skill_id;
    
    db.run('DELETE FROM person_skills WHERE person_id = ? AND skill_id = ?', [person_id, skill_id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
        } else if (this.changes === 0) {
            res.status(404).json({ error: 'Person skill assignment not found' });
        } else {
            res.json({ message: 'Skill assignment removed successfully' });
        }
    });
});

// ========== DEPARTMENT COMMANDER MANAGEMENT ==========

// POST assign department commander
app.post('/api/departments/:id/commander', (req, res) => {
    const { person_id } = req.body;
    const department_id = req.params.id;
    
    if (!person_id) {
        return res.status(400).json({ error: 'Person ID is required' });
    }
    
    // Check if person exists and is in this department
    db.get('SELECT id FROM personnel WHERE id = ? AND department_id = ?', [person_id, department_id], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!row) {
            return res.status(400).json({ error: 'Person not found or not assigned to this department' });
        }
        
        // Update department commander
        db.run('UPDATE departments SET commander_id = ? WHERE id = ?', [person_id, department_id], function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
            } else if (this.changes === 0) {
                res.status(404).json({ error: 'Department not found' });
            } else {
                res.json({ message: 'Department commander assigned successfully' });
            }
        });
    });
});

// DELETE remove department commander
app.delete('/api/departments/:id/commander', (req, res) => {
    const department_id = req.params.id;
    
    db.run('UPDATE departments SET commander_id = NULL WHERE id = ?', [department_id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
        } else if (this.changes === 0) {
            res.status(404).json({ error: 'Department not found' });
        } else {
            res.json({ message: 'Department commander removed successfully' });
        }
    });
});

// ========== OTHER LOOKUP DATA APIs ==========

// ========== POSITIONS CRUD API ==========

// GET all positions with role count
app.get('/api/positions', (req, res) => {
    const query = `
        SELECT p.*, 
               COUNT(r.id) as role_count
        FROM positions p
        LEFT JOIN roles r ON p.id = r.position_id
        GROUP BY p.id
        ORDER BY p.name
    `;
    
    db.all(query, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json(rows);
        }
    });
});

// GET single position with role-holders
app.get('/api/positions/:id', (req, res) => {
    const positionQuery = `
        SELECT p.*, 
               COUNT(r.id) as role_count
        FROM positions p
        LEFT JOIN roles r ON p.id = r.position_id
        WHERE p.id = ?
        GROUP BY p.id
    `;
    
    db.get(positionQuery, [req.params.id], (err, position) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!position) {
            return res.status(404).json({ error: 'Position not found' });
        }
        
        // Get role-holders with their qualifications
        const rolesQuery = `
            SELECT r.id, r.name, r.notes,
                   GROUP_CONCAT(rs.skill_id) as qualification_ids,
                   GROUP_CONCAT(s.name) as qualification_names
            FROM roles r
            LEFT JOIN role_skills rs ON r.id = rs.role_id
            LEFT JOIN skills s ON rs.skill_id = s.id
            WHERE r.position_id = ?
            GROUP BY r.id, r.name, r.notes
            ORDER BY r.name
        `;
        
        db.all(rolesQuery, [req.params.id], (err, roles) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            
            // Format role-holders data
            const roleHolders = roles.map(role => ({
                id: role.id,
                name: role.name,
                notes: role.notes,
                qualification_ids: role.qualification_ids ? role.qualification_ids.split(',').map(Number) : [],
                qualification_names: role.qualification_names ? role.qualification_names.split(',') : []
            }));
            
            // Add role-holders to position data
            position.role_holders = roleHolders;
            
            res.json(position);
        });
    });
});

// POST create position
app.post('/api/positions', (req, res) => {
    const { name, notes, role_holders } = req.body;
    
    console.log('POST /api/positions received:', {
        name: name,
        notes: notes,
        role_holders: role_holders,
        role_holders_type: typeof role_holders,
        role_holders_length: role_holders ? role_holders.length : 'undefined',
        body: req.body,
        bodyKeys: Object.keys(req.body)
    });
    
    if (!name) {
        console.log('Validation failed: Position name is required');
        return res.status(400).json({ error: 'Position name is required' });
    }
    
    if (!role_holders) {
        console.log('Validation failed: role_holders is missing or null');
        return res.status(400).json({ error: 'role_holders field is required' });
    }
    
    if (!Array.isArray(role_holders)) {
        console.log('Validation failed: role_holders is not an array, type:', typeof role_holders);
        return res.status(400).json({ error: 'role_holders must be an array' });
    }
    
    if (role_holders.length === 0) {
        console.log('Validation failed: role_holders array is empty');
        return res.status(400).json({ error: 'At least one role holder is required' });
    }
    
    // Validate role holders
    for (let i = 0; i < role_holders.length; i++) {
        const roleHolder = role_holders[i];
        console.log(`Validating role holder ${i + 1}:`, roleHolder);
        
        if (!roleHolder.name || !roleHolder.name.trim()) {
            console.log(`Validation failed: Role holder ${i + 1} name is required`);
            return res.status(400).json({ error: `Role holder ${i + 1} name is required` });
        }
        if (!roleHolder.qualification_ids || roleHolder.qualification_ids.length === 0) {
            console.log(`Validation failed: Role holder "${roleHolder.name}" must have at least one qualification`);
            return res.status(400).json({ error: `Role holder "${roleHolder.name}" must have at least one qualification` });
        }
    }
    
    // Check for unique name (case insensitive)
    db.get('SELECT id FROM positions WHERE LOWER(name) = LOWER(?)', [name], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (row) {
            return res.status(400).json({ error: 'Position name already exists' });
        }
        
        // Begin transaction
        db.run('BEGIN TRANSACTION', (err) => {
            if (err) {
                return res.status(500).json({ error: 'Database transaction error' });
            }
            
            // Insert position
            const positionQuery = 'INSERT INTO positions (name, notes) VALUES (?, ?)';
            db.run(positionQuery, [name, notes], function(err) {
                if (err) {
                    db.run('ROLLBACK');
                    return res.status(500).json({ error: err.message });
                }
                
                const positionId = this.lastID;
                let completedRoles = 0;
                let hasError = false;
                
                // Insert roles and their skills
                role_holders.forEach((roleHolder, index) => {
                    if (hasError) return;
                    
                    const roleQuery = 'INSERT INTO roles (position_id, name, notes) VALUES (?, ?, ?)';
                    db.run(roleQuery, [positionId, roleHolder.name.trim(), ''], function(err) {
                        if (err) {
                            hasError = true;
                            db.run('ROLLBACK');
                            return res.status(500).json({ error: `Error creating role "${roleHolder.name}": ${err.message}` });
                        }
                        
                        const roleId = this.lastID;
                        let completedSkills = 0;
                        
                        // Insert role skills
                        roleHolder.qualification_ids.forEach(skillId => {
                            const skillQuery = 'INSERT INTO role_skills (role_id, skill_id, is_mandatory) VALUES (?, ?, 1)';
                            db.run(skillQuery, [roleId, skillId], (err) => {
                                if (err && !hasError) {
                                    hasError = true;
                                    db.run('ROLLBACK');
                                    return res.status(500).json({ error: `Error creating skill requirement: ${err.message}` });
                                }
                                
                                completedSkills++;
                                if (completedSkills === roleHolder.qualification_ids.length) {
                                    completedRoles++;
                                    if (completedRoles === role_holders.length && !hasError) {
                                        // All done, commit transaction
                                        db.run('COMMIT', (err) => {
                                            if (err) {
                                                return res.status(500).json({ error: 'Error committing transaction' });
                                            }
                                            res.json({ 
                                                id: positionId, 
                                                message: `Position "${name}" created with ${role_holders.length} role holders` 
                                            });
                                        });
                                    }
                                }
                            });
                        });
                    });
                });
            });
        });
    });
});

// PUT update position with role-holders
app.put('/api/positions/:id', (req, res) => {
    const { name, notes, role_holders } = req.body;
    
    console.log('PUT /api/positions received:', {
        name: name,
        notes: notes,
        role_holders: role_holders,
        role_holders_type: typeof role_holders,
        role_holders_length: role_holders ? role_holders.length : 'undefined'
    });
    
    if (!name) {
        return res.status(400).json({ error: 'Position name is required' });
    }
    
    if (!role_holders) {
        return res.status(400).json({ error: 'role_holders field is required' });
    }
    
    if (!Array.isArray(role_holders)) {
        return res.status(400).json({ error: 'role_holders must be an array' });
    }
    
    if (role_holders.length === 0) {
        return res.status(400).json({ error: 'At least one role holder is required' });
    }
    
    // Validate role holders
    for (let i = 0; i < role_holders.length; i++) {
        const roleHolder = role_holders[i];
        
        if (!roleHolder.name || !roleHolder.name.trim()) {
            return res.status(400).json({ error: `Role holder ${i + 1} name is required` });
        }
        if (!roleHolder.qualification_ids || roleHolder.qualification_ids.length === 0) {
            return res.status(400).json({ error: `Role holder "${roleHolder.name}" must have at least one qualification` });
        }
    }
    
    // Check for unique name (excluding current record)
    db.get('SELECT id FROM positions WHERE LOWER(name) = LOWER(?) AND id != ?', [name, req.params.id], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (row) {
            return res.status(400).json({ error: 'Position name already exists' });
        }
        
        // Begin transaction
        db.run('BEGIN TRANSACTION', (err) => {
            if (err) {
                return res.status(500).json({ error: 'Database transaction error' });
            }
            
            // Update position basic info
            const positionQuery = `
                UPDATE positions SET
                    name = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `;
            
            db.run(positionQuery, [name, notes, req.params.id], function(err) {
                if (err) {
                    db.run('ROLLBACK');
                    return res.status(500).json({ error: err.message });
                }
                if (this.changes === 0) {
                    db.run('ROLLBACK');
                    return res.status(404).json({ error: 'Position not found' });
                }
                
                // Delete existing roles and their skills (CASCADE will handle role_skills)
                db.run('DELETE FROM roles WHERE position_id = ?', [req.params.id], (err) => {
                    if (err) {
                        db.run('ROLLBACK');
                        return res.status(500).json({ error: 'Error removing existing roles' });
                    }
                    
                    let completedRoles = 0;
                    let hasError = false;
                    
                    // Insert new roles and their skills
                    role_holders.forEach((roleHolder, index) => {
                        if (hasError) return;
                        
                        const roleQuery = 'INSERT INTO roles (position_id, name, notes) VALUES (?, ?, ?)';
                        db.run(roleQuery, [req.params.id, roleHolder.name.trim(), ''], function(err) {
                            if (err) {
                                hasError = true;
                                db.run('ROLLBACK');
                                return res.status(500).json({ error: `Error creating role "${roleHolder.name}": ${err.message}` });
                            }
                            
                            const roleId = this.lastID;
                            let completedSkills = 0;
                            
                            // Insert role skills
                            roleHolder.qualification_ids.forEach(skillId => {
                                const skillQuery = 'INSERT INTO role_skills (role_id, skill_id, is_mandatory) VALUES (?, ?, 1)';
                                db.run(skillQuery, [roleId, skillId], (err) => {
                                    if (err && !hasError) {
                                        hasError = true;
                                        db.run('ROLLBACK');
                                        return res.status(500).json({ error: `Error creating skill requirement: ${err.message}` });
                                    }
                                    
                                    completedSkills++;
                                    if (completedSkills === roleHolder.qualification_ids.length) {
                                        completedRoles++;
                                        if (completedRoles === role_holders.length && !hasError) {
                                            // All done, commit transaction
                                            db.run('COMMIT', (err) => {
                                                if (err) {
                                                    return res.status(500).json({ error: 'Error committing transaction' });
                                                }
                                                res.json({ 
                                                    message: `Position "${name}" updated with ${role_holders.length} role holders` 
                                                });
                                            });
                                        }
                                    }
                                });
                            });
                        });
                    });
                });
            });
        });
    });
});

// DELETE position
app.delete('/api/positions/:id', (req, res) => {
    // First check if any roles are assigned to this position
    db.get('SELECT COUNT(*) as count FROM roles WHERE position_id = ?', [req.params.id], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        
        if (row.count > 0) {
            return res.status(400).json({ 
                error: 'Cannot delete position - there are role-holders assigned to it',
                assigned_count: row.count 
            });
        }
        
        // Safe to delete
        db.run('DELETE FROM positions WHERE id = ?', [req.params.id], function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
            } else if (this.changes === 0) {
                res.status(404).json({ error: 'Position not found' });
            } else {
                res.json({ message: 'Position deleted successfully' });
            }
        });
    });
});

// ========== ROLES (ROLE-HOLDERS) CRUD API ==========

// GET roles for a position with required skills
app.get('/api/positions/:id/roles', (req, res) => {
    const query = `
        SELECT r.*, 
               GROUP_CONCAT(s.name) as required_skills,
               GROUP_CONCAT(rs.skill_id) as skill_ids,
               GROUP_CONCAT(rs.is_mandatory) as skill_mandatory
        FROM roles r
        LEFT JOIN role_skills rs ON r.id = rs.role_id
        LEFT JOIN skills s ON rs.skill_id = s.id
        WHERE r.position_id = ?
        GROUP BY r.id
        ORDER BY r.name
    `;
    
    db.all(query, [req.params.id], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json(rows);
        }
    });
});

// POST create role
app.post('/api/positions/:id/roles', (req, res) => {
    const { name, notes, required_skills } = req.body;
    const position_id = req.params.id;
    
    if (!name) {
        return res.status(400).json({ error: 'Role name is required' });
    }
    
    if (!required_skills || required_skills.length === 0) {
        return res.status(400).json({ error: 'At least one required skill must be specified' });
    }
    
    // Check for unique name within position
    db.get('SELECT id FROM roles WHERE position_id = ? AND LOWER(name) = LOWER(?)', [position_id, name], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (row) {
            return res.status(400).json({ error: 'Role name already exists in this position' });
        }
        
        // Insert role
        const query = 'INSERT INTO roles (position_id, name, notes) VALUES (?, ?, ?)';
        
        db.run(query, [position_id, name, notes], function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            
            const roleId = this.lastID;
            
            // Insert required skills
            const skillQueries = required_skills.map(skill => 
                new Promise((resolve, reject) => {
                    db.run('INSERT INTO role_skills (role_id, skill_id, is_mandatory) VALUES (?, ?, ?)', 
                        [roleId, skill.skill_id, skill.is_mandatory ? 1 : 0], 
                        (err) => err ? reject(err) : resolve()
                    );
                })
            );
            
            Promise.all(skillQueries)
                .then(() => res.json({ id: roleId, message: 'Role created successfully' }))
                .catch(err => res.status(500).json({ error: err.message }));
        });
    });
});

// PUT update role
app.put('/api/positions/:position_id/roles/:id', (req, res) => {
    const { name, notes, required_skills } = req.body;
    const roleId = req.params.id;
    const position_id = req.params.position_id;
    
    if (!name) {
        return res.status(400).json({ error: 'Role name is required' });
    }
    
    if (!required_skills || required_skills.length === 0) {
        return res.status(400).json({ error: 'At least one required skill must be specified' });
    }
    
    // Check for unique name within position (excluding current record)
    db.get('SELECT id FROM roles WHERE position_id = ? AND LOWER(name) = LOWER(?) AND id != ?', 
        [position_id, name, roleId], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (row) {
            return res.status(400).json({ error: 'Role name already exists in this position' });
        }
        
        // Start transaction for atomic update
        db.serialize(() => {
            db.run('BEGIN TRANSACTION');
            
            // Update role
            db.run('UPDATE roles SET name = ?, notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', 
                [name, notes, roleId], function(err) {
                if (err) {
                    db.run('ROLLBACK');
                    return res.status(500).json({ error: err.message });
                }
                
                if (this.changes === 0) {
                    db.run('ROLLBACK');
                    return res.status(404).json({ error: 'Role not found' });
                }
                
                // Delete existing role skills
                db.run('DELETE FROM role_skills WHERE role_id = ?', [roleId], (err) => {
                    if (err) {
                        db.run('ROLLBACK');
                        return res.status(500).json({ error: err.message });
                    }
                    
                    // Insert new required skills
                    const skillPromises = required_skills.map(skill => 
                        new Promise((resolve, reject) => {
                            db.run('INSERT INTO role_skills (role_id, skill_id, is_mandatory) VALUES (?, ?, ?)', 
                                [roleId, skill.skill_id, skill.is_mandatory ? 1 : 0], 
                                (err) => err ? reject(err) : resolve()
                            );
                        })
                    );
                    
                    Promise.all(skillPromises)
                        .then(() => {
                            db.run('COMMIT');
                            res.json({ message: 'Role updated successfully' });
                        })
                        .catch(err => {
                            db.run('ROLLBACK');
                            res.status(500).json({ error: err.message });
                        });
                });
            });
        });
    });
});

// DELETE role
app.delete('/api/positions/:position_id/roles/:id', (req, res) => {
    const roleId = req.params.id;
    
    db.run('DELETE FROM roles WHERE id = ?', [roleId], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
        } else if (this.changes === 0) {
            res.status(404).json({ error: 'Role not found' });
        } else {
            res.json({ message: 'Role deleted successfully' });
        }
    });
});

// ========== CONSTRAINTS CRUD API ==========

// GET constraints with filtering
app.get('/api/constraints', (req, res) => {
    const { departmentId, weekStart, department, week } = req.query;
    
    // Support both parameter names for flexibility
    const deptId = departmentId || department;
    const weekStartDate = weekStart || week;
    
    let query = `
        SELECT c.*, p.full_name, p.rank 
        FROM constraints c
        JOIN personnel p ON c.person_id = p.id
        WHERE 1=1
    `;
    const params = [];
    
    if (deptId) {
        query += ' AND p.department_id = ?';
        params.push(deptId);
    }
    
    if (weekStartDate) {
        // Get week range (Sunday to Saturday)
        const startDate = new Date(weekStartDate);
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        
        query += ' AND c.date BETWEEN ? AND ?';
        params.push(weekStartDate, endDate.toISOString().split('T')[0]);
    }
    
    query += ' ORDER BY c.date, p.full_name';
    
    db.all(query, params, (err, rows) => {
        if (err) {
            console.error('Error fetching constraints:', err);
            res.status(500).json({ error: err.message });
        } else {
            res.json(rows);
        }
    });
});

// GET single constraint
app.get('/api/constraints/:id', (req, res) => {
    const query = `
        SELECT c.*, p.full_name, p.rank 
        FROM constraints c
        JOIN personnel p ON c.person_id = p.id
        WHERE c.id = ?
    `;
    
    db.get(query, [req.params.id], (err, row) => {
        if (err) {
            console.error('Error fetching constraint:', err);
            res.status(500).json({ error: err.message });
        } else if (!row) {
            res.status(404).json({ error: 'Constraint not found' });
        } else {
            res.json(row);
        }
    });
});

// POST create constraint
app.post('/api/constraints', (req, res) => {
    const { person_id, date, type, is_full_day, start_time, end_time, description } = req.body;
    
    // Valid constraint types
    const validTypes = ['vacation', 'personal', 'medical', 'military', 'reserves', 'course', 'other'];
    
    // Validation
    if (!person_id || !date || !type) {
        return res.status(400).json({ error: 'person_id, date, and type are required' });
    }
    
    if (!validTypes.includes(type)) {
        return res.status(400).json({ 
            error: 'Invalid constraint type',
            field: 'type',
            message: `Type must be one of: ${validTypes.join(', ')}`
        });
    }
    
    if (!is_full_day && (!start_time || !end_time)) {
        return res.status(400).json({ error: 'start_time and end_time are required when not full day' });
    }
    
    if (!is_full_day && start_time >= end_time) {
        return res.status(400).json({ error: 'start_time must be before end_time' });
    }
    
    // Check if person exists and get their department
    db.get('SELECT department_id FROM personnel WHERE id = ?', [person_id], (err, person) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!person) {
            return res.status(400).json({ error: 'Person not found' });
        }
        
        // Check for existing constraint on same date
        db.get('SELECT id FROM constraints WHERE person_id = ? AND date = ?', [person_id, date], (err, existing) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            if (existing) {
                return res.status(400).json({ error: 'Constraint already exists for this person on this date' });
            }
            
            // Insert new constraint
            const query = `
                INSERT INTO constraints (person_id, date, type, is_full_day, start_time, end_time, description)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `;
            
            db.run(query, [person_id, date, type, is_full_day, start_time, end_time, description], function(err) {
                if (err) {
                    console.error('Error creating constraint:', err);
                    res.status(500).json({ error: err.message });
                } else {
                    res.status(201).json({ 
                        id: this.lastID, 
                        message: 'Constraint created successfully' 
                    });
                }
            });
        });
    });
});

// PUT update constraint
app.put('/api/constraints/:id', (req, res) => {
    const { person_id, date, type, is_full_day, start_time, end_time, description } = req.body;
    const constraintId = req.params.id;
    
    // Valid constraint types
    const validTypes = ['vacation', 'personal', 'medical', 'military', 'reserves', 'course', 'other'];
    
    // Validation
    if (!person_id || !date || !type) {
        return res.status(400).json({ error: 'person_id, date, and type are required' });
    }
    
    if (!validTypes.includes(type)) {
        return res.status(400).json({ 
            error: 'Invalid constraint type',
            field: 'type',
            message: `Type must be one of: ${validTypes.join(', ')}`
        });
    }
    
    if (!is_full_day && (!start_time || !end_time)) {
        return res.status(400).json({ error: 'start_time and end_time are required when not full day' });
    }
    
    if (!is_full_day && start_time >= end_time) {
        return res.status(400).json({ error: 'start_time must be before end_time' });
    }
    
    // Check if constraint exists
    db.get('SELECT id FROM constraints WHERE id = ?', [constraintId], (err, existing) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!existing) {
            return res.status(404).json({ error: 'Constraint not found' });
        }
        
        // Check for conflicting constraint (different ID, same person and date)
        db.get('SELECT id FROM constraints WHERE person_id = ? AND date = ? AND id != ?', [person_id, date, constraintId], (err, conflict) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            if (conflict) {
                return res.status(400).json({ error: 'Another constraint already exists for this person on this date' });
            }
            
            // Update constraint
            const query = `
                UPDATE constraints SET 
                    person_id = ?, date = ?, type = ?, is_full_day = ?, 
                    start_time = ?, end_time = ?, description = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `;
            
            db.run(query, [person_id, date, type, is_full_day, start_time, end_time, description, constraintId], function(err) {
                if (err) {
                    console.error('Error updating constraint:', err);
                    res.status(500).json({ error: err.message });
                } else {
                    res.json({ message: 'Constraint updated successfully' });
                }
            });
        });
    });
});

// DELETE constraint
app.delete('/api/constraints/:id', (req, res) => {
    const constraintId = req.params.id;
    
    db.get('SELECT id FROM constraints WHERE id = ?', [constraintId], (err, existing) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!existing) {
            return res.status(404).json({ error: 'Constraint not found' });
        }
        
        db.run('DELETE FROM constraints WHERE id = ?', [constraintId], function(err) {
            if (err) {
                console.error('Error deleting constraint:', err);
                res.status(500).json({ error: err.message });
            } else {
                res.json({ message: 'Constraint deleted successfully' });
            }
        });
    });
});

// ========== SCHEDULE API ==========

// GET schedule for position and week
app.get('/api/schedule', (req, res) => {
    const { positionId, weekStart } = req.query;
    
    if (!positionId || !weekStart) {
        return res.status(400).json({ error: 'positionId and weekStart are required' });
    }
    
    // Get or create schedule week
    db.get('SELECT * FROM schedule_weeks WHERE position_id = ? AND week_start = ?', [positionId, weekStart], (err, scheduleWeek) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        
        let scheduleWeekId;
        
        const processSchedule = (weekId) => {
            // Get time blocks (time ranges)
            db.all('SELECT * FROM time_blocks WHERE schedule_week_id = ? ORDER BY start_time', [weekId], (err, timeBlocks) => {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }
                
                // If no time blocks exist, create default 08:00-14:00
                if (timeBlocks.length === 0) {
                    db.run('INSERT INTO time_blocks (schedule_week_id, start_time, end_time) VALUES (?, ?, ?)', 
                        [weekId, '08:00', '14:00'], function(err) {
                        if (err) {
                            return res.status(500).json({ error: err.message });
                        }
                        
                        timeBlocks = [{
                            id: this.lastID,
                            schedule_week_id: weekId,
                            start_time: '08:00',
                            end_time: '14:00'
                        }];
                        
                        continueProcessing();
                    });
                } else {
                    continueProcessing();
                }
                
                function continueProcessing() {
                    // Get position roles (role holders)
                    db.all(`
                        SELECT r.*, 
                               GROUP_CONCAT(rs.skill_id) as required_skill_ids
                        FROM roles r
                        LEFT JOIN role_skills rs ON r.id = rs.role_id
                        WHERE r.position_id = ?
                        GROUP BY r.id
                        ORDER BY r.name
                    `, [positionId], (err, roleHolders) => {
                        if (err) {
                            return res.status(500).json({ error: err.message });
                        }
                        
                        // Get assignments
                        db.all(`
                            SELECT a.*, p.full_name, p.rank, tb.start_time, tb.end_time
                            FROM assignments a
                            JOIN time_blocks tb ON a.time_block_id = tb.id
                            LEFT JOIN personnel p ON a.person_id = p.id
                            WHERE tb.schedule_week_id = ?
                            ORDER BY a.day_of_week, tb.start_time
                        `, [weekId], (err, assignments) => {
                            if (err) {
                                return res.status(500).json({ error: err.message });
                            }
                            
                            res.json({
                                timeRanges: timeBlocks.map(tb => ({
                                    id: tb.id,
                                    start: tb.start_time,
                                    end: tb.end_time
                                })),
                                roleHolders: roleHolders.map(rh => ({
                                    ...rh,
                                    required_skill_ids: rh.required_skill_ids ? rh.required_skill_ids.split(',').map(id => parseInt(id)) : []
                                })),
                                assignments: assignments,
                                notes: scheduleWeek ? scheduleWeek.notes : '',
                                scheduleWeekId: weekId
                            });
                        });
                    });
                }
            });
        };
        
        if (scheduleWeek) {
            processSchedule(scheduleWeek.id);
        } else {
            // Create new schedule week
            db.run('INSERT INTO schedule_weeks (position_id, week_start, notes) VALUES (?, ?, ?)', 
                [positionId, weekStart, ''], function(err) {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }
                processSchedule(this.lastID);
            });
        }
    });
});

// POST create time range
app.post('/api/time-ranges', (req, res) => {
    const { positionId, weekStart, start, end } = req.body;
    
    console.log('POST /api/time-ranges received:', {
        positionId: positionId,
        weekStart: weekStart,
        start: start,
        end: end,
        body: req.body,
        bodyKeys: Object.keys(req.body)
    });
    
    if (!positionId || !weekStart || !start || !end) {
        console.log('Validation failed: Missing required fields');
        return res.status(400).json({ error: 'positionId, weekStart, start, and end are required' });
    }
    
    if (start >= end) {
        return res.status(400).json({ error: 'Start time must be before end time' });
    }
    
    // Get or create schedule week
    db.get('SELECT id FROM schedule_weeks WHERE position_id = ? AND week_start = ?', [positionId, weekStart], (err, week) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        
        const insertTimeBlock = (weekId) => {
            db.run('INSERT INTO time_blocks (schedule_week_id, start_time, end_time) VALUES (?, ?, ?)', 
                [weekId, start, end], function(err) {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }
                
                res.status(201).json({
                    id: this.lastID,
                    start: start,
                    end: end,
                    message: 'Time range created successfully'
                });
            });
        };
        
        if (week) {
            insertTimeBlock(week.id);
        } else {
            // Create schedule week first
            db.run('INSERT INTO schedule_weeks (position_id, week_start, notes) VALUES (?, ?, ?)', 
                [positionId, weekStart, ''], function(err) {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }
                insertTimeBlock(this.lastID);
            });
        }
    });
});

// PUT update time range
app.put('/api/time-ranges/:id', (req, res) => {
    const { start, end } = req.body;
    const timeBlockId = req.params.id;
    
    if (!start || !end) {
        return res.status(400).json({ error: 'start and end are required' });
    }
    
    if (start >= end) {
        return res.status(400).json({ error: 'Start time must be before end time' });
    }
    
    db.run('UPDATE time_blocks SET start_time = ?, end_time = ? WHERE id = ?', [start, end, timeBlockId], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Time range not found' });
        }
        
        res.json({ message: 'Time range updated successfully' });
    });
});

// DELETE time range (with validation)
app.delete('/api/time-ranges/:id', (req, res) => {
    const timeBlockId = req.params.id;
    
    // Check if this would leave 0 time ranges
    db.get(`
        SELECT sw.id as schedule_week_id, COUNT(tb.id) as time_block_count
        FROM time_blocks tb
        JOIN schedule_weeks sw ON tb.schedule_week_id = sw.id
        WHERE sw.id = (SELECT schedule_week_id FROM time_blocks WHERE id = ?)
        GROUP BY sw.id
    `, [timeBlockId], (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        
        if (!result) {
            return res.status(404).json({ error: 'Time range not found' });
        }
        
        if (result.time_block_count <= 1) {
            return res.status(400).json({ error: 'Cannot delete the last time range. At least one time range must exist.' });
        }
        
        // Delete the time block (assignments will cascade delete)
        db.run('DELETE FROM time_blocks WHERE id = ?', [timeBlockId], function(err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            
            res.json({ message: 'Time range deleted successfully' });
        });
    });
});

// POST create assignment
app.post('/api/assignments', (req, res) => {
    const { positionId, weekStart, roleHolderId, date, start, end, personnelId } = req.body;
    
    if (!positionId || !weekStart || !roleHolderId || !date || !start || !end || !personnelId) {
        return res.status(400).json({ error: 'All fields are required' });
    }
    
    // Convert date to day of week (0=Sunday)
    const dayOfWeek = new Date(date).getDay();
    
    // Get time block ID
    db.get(`
        SELECT tb.id 
        FROM time_blocks tb
        JOIN schedule_weeks sw ON tb.schedule_week_id = sw.id
        WHERE sw.position_id = ? AND sw.week_start = ? AND tb.start_time = ? AND tb.end_time = ?
    `, [positionId, weekStart, start, end], (err, timeBlock) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        
        if (!timeBlock) {
            return res.status(404).json({ error: 'Time block not found' });
        }
        
        // Check for existing assignment in this slot
        db.get('SELECT id FROM assignments WHERE time_block_id = ? AND role_id = ? AND day_of_week = ?', 
            [timeBlock.id, roleHolderId, dayOfWeek], (err, existing) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            
            if (existing) {
                return res.status(400).json({ error: 'This slot is already assigned' });
            }
            
            // TODO: Add qualification and constraint validation here
            
            // Create assignment
            db.run('INSERT INTO assignments (time_block_id, role_id, day_of_week, person_id) VALUES (?, ?, ?, ?)',
                [timeBlock.id, roleHolderId, dayOfWeek, personnelId], function(err) {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }
                
                res.status(201).json({
                    id: this.lastID,
                    message: 'Assignment created successfully'
                });
            });
        });
    });
});

// DELETE assignment
app.delete('/api/assignments/:id', (req, res) => {
    const assignmentId = req.params.id;
    
    db.run('DELETE FROM assignments WHERE id = ?', [assignmentId], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Assignment not found' });
        }
        
        res.json({ message: 'Assignment deleted successfully' });
    });
});

// GET/PUT schedule notes
app.get('/api/schedule/notes', (req, res) => {
    const { positionId, weekStart } = req.query;
    
    if (!positionId || !weekStart) {
        return res.status(400).json({ error: 'positionId and weekStart are required' });
    }
    
    db.get('SELECT notes FROM schedule_weeks WHERE position_id = ? AND week_start = ?', [positionId, weekStart], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        
        res.json({ notes: row ? row.notes : '' });
    });
});

app.put('/api/schedule/notes', (req, res) => {
    const { positionId, weekStart, notes } = req.body;
    
    if (!positionId || !weekStart) {
        return res.status(400).json({ error: 'positionId and weekStart are required' });
    }
    
    // Get or create schedule week, then update notes
    db.get('SELECT id FROM schedule_weeks WHERE position_id = ? AND week_start = ?', [positionId, weekStart], (err, week) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        
        if (week) {
            db.run('UPDATE schedule_weeks SET notes = ? WHERE id = ?', [notes || '', week.id], function(err) {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }
                res.json({ message: 'Notes updated successfully' });
            });
        } else {
            db.run('INSERT INTO schedule_weeks (position_id, week_start, notes) VALUES (?, ?, ?)', 
                [positionId, weekStart, notes || ''], function(err) {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }
                res.json({ message: 'Notes updated successfully' });
            });
        }
    });
});

// Serve the main HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`קה״דיה server running on port ${PORT}`);
    console.log(`Open http://localhost:${PORT} to view the application`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error(err.message);
        } else {
            console.log('Database connection closed.');
        }
        process.exit(0);
    });
});